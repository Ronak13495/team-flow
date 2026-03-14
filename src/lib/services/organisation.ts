// src/lib/services/organisation.ts

import prisma from "@/lib/prisma"
import { MemberRole } from "@/generated/prisma"

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createOrganisation(
  name: string,
  userId: string  // the user who is creating the org becomes the OWNER
) {
  // Generate a URL-friendly slug from the name.
  // "Acme Corp!" → "acme-corp"
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special characters
    .replace(/\s+/g, "-")          // replace spaces with hyphens

  // Make slug unique by appending a random 4-char string.
  // This prevents collisions if two orgs have the same name.
  const uniqueSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  // prisma.$transaction() runs multiple database operations as ONE atomic unit.
  // If creating the org succeeds but adding the member fails,
  // the ENTIRE thing rolls back — you never end up with an org with no owner.
  // This is called a "transaction" and is essential for data integrity.
  const organisation = await prisma.$transaction(async (tx) => {
    // tx is the transaction client — use it instead of prisma inside here
    const org = await tx.organisation.create({
      data: {
        name,
        slug: uniqueSlug,
      },
    })

    // Immediately add the creator as OWNER
    await tx.organisationMember.create({
      data: {
        orgId: org.id,
        userId,
        role: MemberRole.OWNER,
      },
    })

    return org
  })

  return organisation
}

// ─── READ ─────────────────────────────────────────────────────────────────────

// Get all organisations a user belongs to
export async function getUserOrganisations(userId: string) {
  return prisma.organisationMember.findMany({
    where: { userId },
    // include tells Prisma to JOIN and fetch related data in one query.
    // Without include, you'd get orgId but not the org's name/slug.
    include: {
      organisation: true,
    },
    orderBy: { joinedAt: "asc" },
  })
}

// Get a single org — but ONLY if the requesting user is a member.
// This is an authorisation check built into the data fetch.
// Never fetch an org without verifying membership first.
export async function getOrganisation(orgId: string, userId: string) {
  const membership = await prisma.organisationMember.findUnique({
    where: {
      orgId_userId: { orgId, userId },
      // orgId_userId is the name Prisma generates for our @@unique([orgId, userId])
      // constraint — it lets us look up a membership by both fields at once
    },
    include: {
      organisation: {
        include: {
          members: {
            include: { user: true }, // include user details for each member
          },
        },
      },
    },
  })

  // Return null if user isn't a member — caller handles the 403/redirect
  if (!membership) return null
  return membership.organisation
}

// ─── AUTHORISATION HELPERS ────────────────────────────────────────────────────

// Check if a user is a member of an org — returns their role or null
export async function getUserRole(
  orgId: string,
  userId: string
): Promise<MemberRole | null> {
  const membership = await prisma.organisationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
  return membership?.role ?? null
}

// Check if user has at minimum ADMIN role
export async function requireAdmin(orgId: string, userId: string) {
  const role = await getUserRole(orgId, userId)
  if (!role || role === MemberRole.MEMBER) {
    throw new Error("FORBIDDEN")
    // Throwing here means any route calling requireAdmin()
    // will automatically fail if the user isn't admin/owner.
    // The API route catches this and returns a 403 response.
  }
}