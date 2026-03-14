// src/app/api/projects/[id]/tasks/[taskId]/comments/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import prisma from "@/lib/prisma"

const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
})

// GET /api/projects/[id]/tasks/[taskId]/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { taskId } = await params

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
    // asc = oldest first, so the thread reads top to bottom
  })

  return NextResponse.json(comments)
}

// POST /api/projects/[id]/tasks/[taskId]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { taskId } = await params

  const body = await request.json()
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      taskId,
      authorId: session.user.id,
      // Always use session.user.id — never trust a userId from the request body.
      // If we let the client send authorId, anyone could post as someone else.
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(comment, { status: 201 })
}