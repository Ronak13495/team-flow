// src/app/api/organisations/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { createOrganisation, getUserOrganisations } from "@/lib/services/organisation"

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
})

// GET /api/organisations — returns all orgs for the logged-in user
export async function GET() {
  // Always check the session first in every API route.
  // Never trust that only logged-in users will call your API.
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const orgs = await getUserOrganisations(session.user.id)
  return NextResponse.json(orgs)
}

// POST /api/organisations — creates a new org
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const organisation = await createOrganisation(parsed.data.name, session.user.id)
  return NextResponse.json(organisation, { status: 201 })
}