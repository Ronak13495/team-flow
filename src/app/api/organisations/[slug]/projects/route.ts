// src/app/api/organisations/[slug]/projects/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import prisma from "@/lib/prisma"

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { slug } = await params

  // Find the org
  const org = await prisma.organisation.findUnique({
    where: { slug },
  })

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Verify the user is an ADMIN or OWNER — members can't create projects
  const membership = await prisma.organisationMember.findUnique({
    where: {
      orgId_userId: { orgId: org.id, userId: session.user.id },
    },
  })

  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate request body
  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      orgId: org.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}