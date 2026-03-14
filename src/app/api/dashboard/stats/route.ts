// src/app/api/dashboard/stats/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const userId = session.user.id

  // Find all orgs this user belongs to
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { orgId: true },
  })

  const orgIds = memberships.map((m) => m.orgId)
  // Extract just the IDs into a plain array: ["id1", "id2", ...]

  // Find all projects across all the user's orgs
  const projects = await prisma.project.findMany({
    where: {
      orgId: { in: orgIds },
      // in: orgIds means "orgId must be one of these values"
      // This is SQL's IN operator — very efficient for this use case
      status: "ACTIVE",
    },
    include: {
      // _count is a Prisma feature that counts related records
      // without fetching them all. Much more efficient than
      // fetching all tasks just to call .length on them.
      _count: {
        select: {
          tasks: {
            where: { deletedAt: null },
          },
        },
      },
      tasks: {
        where: { deletedAt: null },
        select: { status: true },
        // We only need the status field — no point fetching
        // titles, descriptions etc. just for counting
      },
    },
  })

  // Tasks assigned to ME across all projects
  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      project: {
        orgId: { in: orgIds },
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: {
        select: { name: true },
      },
    },
    orderBy: { dueDate: "asc" },
    // asc = earliest due date first — most urgent tasks at the top
    take: 5,
    // take: 5 is like SQL LIMIT 5 — only fetch the 5 most urgent tasks
    // No point loading 100 tasks for a summary widget
  })

  // Build project stats — progress percentage for each project
  const projectStats = projects.map((project) => {
    const total = project.tasks.length
    const done = project.tasks.filter((t) => t.status === "DONE").length
    const inProgress = project.tasks.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length
    const todo = project.tasks.filter((t) => t.status === "TODO").length

    const progressPercent =
      total === 0 ? 0 : Math.round((done / total) * 100)
    // Math.round rounds to nearest integer — 66.666 becomes 67
    // Avoid division by zero with the total === 0 check

    return {
      id: project.id,
      name: project.name,
      total,
      done,
      inProgress,
      todo,
      progressPercent,
    }
  })

  // Overall numbers across all projects
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)
  // reduce() accumulates a value across an array.
  // Start at 0, add each project's task count one by one.

  const doneTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "DONE").length,
    0
  )

  const overdueTasks = await prisma.task.count({
    where: {
      deletedAt: null,
      dueDate: { lt: new Date() },
      // lt = "less than" — dueDate is before right now = overdue
      status: { not: "DONE" },
      // Don't count completed tasks as overdue
      project: {
        orgId: { in: orgIds },
        status: "ACTIVE",
      },
    },
  })

  return NextResponse.json({
    summary: {
      totalProjects: projects.length,
      totalTasks,
      doneTasks,
      overdueTasks,
      completionPercent:
        totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    },
    projectStats,
    myTasks,
  })
}