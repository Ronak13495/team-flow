// src/types/index.ts
// Single source of truth for all shared types.
// Import from here instead of redefining types in each file.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export type TaskAssignee = {
  id: string
  name: string | null
  email: string
  image?: string | null
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  position: number
  dueDate: string | null
  projectId: string
  assignee: TaskAssignee | null
}

export type OrgMember = {
  user: {
    id: string
    name: string | null
    email: string
  }
}

export type OrgProject = {
  id: string
  name: string
  status: string
  description: string | null
  dueDate: string | null
}

export type OrgResponse = {
  id: string
  name: string
  slug: string
  projects: OrgProject[]
  members: OrgMember[]
}


export type ProjectStat = {
  id: string
  name: string
  total: number
  done: number
  inProgress: number
  todo: number
  progressPercent: number
}

export type MyTask = {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  project: { name: string }
}

export type DashboardStats = {
  summary: {
    totalProjects: number
    totalTasks: number
    doneTasks: number
    overdueTasks: number
    completionPercent: number
  }
  projectStats: ProjectStat[]
  myTasks: MyTask[]
}

export type OrgMembership = {
  organisation: {
    id: string
    name: string
    slug: string
  }
  role: string
}