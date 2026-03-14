// src/app/api/projects/[id]/tasks/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import prisma from "@/lib/prisma"

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
})

// Helper — checks the user is a member of the org that owns this project
async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organisation: {
        include: {
          members: true,
        },
      },
    },
  })

  if (!project) return null

  const isMember = project.organisation.members.some(
    (m) => m.userId === userId
  )
  if (!isMember) return null

  return project
}

// GET /api/projects/[id]/tasks — fetch all tasks for a project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id } = await params
  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: id,
      deletedAt: null,
      // deletedAt: null means only fetch tasks that haven't been soft-deleted
      // This is how soft delete works in every query — you filter out deleted rows
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { position: "asc" },
    // position: "asc" means tasks appear in the order they were arranged
    // on the Kanban board — lowest position number = top of column
  })

  return NextResponse.json(tasks)
}

// POST /api/projects/[id]/tasks — create a new task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { id } = await params
  const project = await verifyProjectAccess(id, session.user.id)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

// Find highest position in the TARGET status column (not always TODO)
  const lastTask = await prisma.task.findFirst({
    where: { 
      projectId: id, 
      status: parsed.data.status,  // ← was hardcoded "TODO" before
      deletedAt: null 
    },
    orderBy: { position: "desc" },
  })

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: parsed.data.status,   // ← add this line
      assigneeId: parsed.data.assigneeId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      projectId: id,
      position: lastTask ? lastTask.position + 1 : 0,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })

  return NextResponse.json(task, { status: 201 })
}