// src/app/api/organisations/[slug]/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
  // In Next.js 15, params is a Promise — you must await it.
  // This changed from Next.js 14 where params was a plain object.
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { slug } = await params

  // Find the org by slug — but only return it if the
  // current user is actually a member of it
  const org = await prisma.organisation.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              // select limits which fields come back —
              // never accidentally expose hashedPassword
            },
          },
        },
      },
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Check the requesting user is actually a member
  const isMember = org.members.some((m) => m.user.id === session.user!.id)
  // .some() returns true if at least one member matches the condition
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(org)
}