// src/app/api/projects/[id]/tasks/[taskId]/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import prisma from "@/lib/prisma"

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  position: z.number().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(), 
  // nullable() means the value can explicitly be null
  // (to unassign a task) — different from optional() which means
  // the field can be missing from the request entirely
})

// PATCH /api/projects/[id]/tasks/[taskId] — partial update
// We use PATCH (not PUT) because we're updating specific fields,
// not replacing the entire task object
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id, taskId } = await params

  // Verify user has access to this project
  const project = await prisma.project.findUnique({
    where: { id },
    include: { organisation: { include: { members: true } } },
  })

  const isMember = project?.organisation.members.some(
    (m) => m.userId === session.user!.id
  )
  if (!project || !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
// ✅ Fixed — manually convert dueDate string to a Date object
const { dueDate, ...rest } = parsed.data
// Destructure dueDate out separately so we can transform it.
// ...rest contains everything else (title, status, priority etc.)

const task = await prisma.task.update({
  where: { id: taskId },
  data: {
    ...rest,
    // Spread the rest of the fields as-is
    dueDate: dueDate ? new Date(dueDate) : null,
    // Convert the string "2026-03-19" to a proper JS Date object.
    // Prisma then converts that into a PostgreSQL timestamp.
    // If dueDate is null (cleared), we pass null to unset it.
  },
  include: {
    assignee: {
      select: { id: true, name: true, email: true, image: true },
    },
  },
})

  return NextResponse.json(task)
}

// DELETE /api/projects/[id]/tasks/[taskId] — soft delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { taskId } = await params

  // Soft delete — set deletedAt instead of removing the row
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}