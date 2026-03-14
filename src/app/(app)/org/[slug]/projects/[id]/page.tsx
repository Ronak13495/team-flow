// src/app/org/[slug]/projects/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import TaskModal from "@/components/TaskModal"
import type { Task, TaskStatus, TaskPriority, OrgMember, OrgProject, OrgResponse } from "@/types"

// ─── TYPES ────────────────────────────────────────────────────────────────────


// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "TODO", label: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50" },
  { id: "DONE", label: "Done", color: "bg-green-50" },
]

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-red-50 text-red-600",
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onDelete,
  onMove,
  onClick,
}: {
  task: Task
  onDelete: (id: string) => void
  onMove: (id: string, status: TaskStatus) => void
  onClick: () => void
}) {
  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">
          {task.title}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-xs"
        >
          ✕
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-gray-500">
            → {task.assignee.name ?? task.assignee.email}
          </span>
        )}
        {task.dueDate && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          new Date(task.dueDate) < new Date()
            ? "bg-red-50 text-red-500"   // overdue — red
            : "bg-gray-100 text-gray-500" // upcoming — grey
        }`}>
          Due: {new Date(task.dueDate).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
          })}
          {/* Shows "19 Mar" — short format fits nicely on a card */}
          {new Date(task.dueDate) < new Date() && " · Overdue"}
        </span>
      )}
      </div>

      {/* Simple move buttons — much more reliable than drag and drop
          and actually preferred in many real apps for accessibility */}
      <div className="flex gap-1 mt-3 pt-2 border-t border-gray-100">
        {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
          <button
            key={col.id}
            onClick={() => onMove(task.id, col.id)}
            className="text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            → {col.label}
          </button>
        ))}
      </div>
      {/* The filter(c => c.id !== task.status) removes the current
          column from the options — no point showing "→ To Do" on a
          card that's already in To Do */}
    </div>
  )
}

// ─── COLUMN ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onSelectTask,
}: {
  column: (typeof COLUMNS)[0]
  tasks: Task[]
  onAddTask: (status: TaskStatus, title: string) => void
  onDeleteTask: (id: string) => void
  onMoveTask: (id: string, status: TaskStatus) => void
  onSelectTask: (task: Task) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    onAddTask(column.id, newTitle.trim())
    setNewTitle("")
    setIsAdding(false)
  }

  return (
    <div className={`${column.color} rounded-xl p-4 flex flex-col min-h-96`}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 text-sm">{column.label}</h3>
          <span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Quick add form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            className="text-gray-900 placeholder:text-gray-400 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="flex flex-col gap-2 flex-1">
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 text-xs">No tasks yet</p>
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
        key={task.id}
        task={task}
        onDelete={onDeleteTask}
        onMove={onMoveTask}
        onClick={() => onSelectTask(task)}
        // Clicking a card opens the modal with that task's data
      />
        ))}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProjectPage() {


  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const projectId = params.id as string

  const [tasks, setTasks] = useState<Task[]>([])
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [members, setMembers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [modalKey, setModalKey] = useState(0)

 useEffect(() => {
  if (status !== "authenticated") return

  fetch(`/api/organisations/${slug}`)
    .then((r) => r.json())
    .then((org) => {
      const project = org.projects?.find((p: OrgProject) => p.id === projectId)
      if (project) setProjectName(project.name)

      // Extract just the user objects from the members array
      if (Array.isArray(org.members)) {
      setMembers(org.members.map((m: OrgMember) => m.user))
    }
    })

  fetch(`/api/projects/${projectId}/tasks`)
    .then((r) => r.json())
    .then((data) => {
      setTasks(data)
      setIsLoading(false)
    })
}, [status, projectId, slug])

  // Group tasks by their status column
  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      acc[task.status] = [...(acc[task.status] ?? []), task]
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

function handleTaskUpdate(updatedTask: Task) {
  setTasks((prev) =>
    prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
  )
  setSelectedTask(updatedTask)
  setModalKey((k) => k + 1)
  
}

  async function handleAddTask(taskStatus: TaskStatus, title: string) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: taskStatus }),
    })
    if (res.ok) {
      const newTask = await res.json()
      setTasks((prev) => [...prev, newTask])
    }
  }

  async function handleDeleteTask(taskId: string) {
    // Optimistic update — remove from UI instantly, sync in background
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    })
  }

  async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
    // Optimistic update — move card instantly in the UI
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    // Then persist to server in the background
    await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading board...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/org/${slug}`)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="font-semibold text-gray-900">{projectName}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] ?? []}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onSelectTask={setSelectedTask}
            />
          ))}
        </div>
      </div>

      {/* Task detail modal */}
        {selectedTask && (
          <TaskModal
            key={modalKey}
            task={selectedTask}
            projectId={projectId}
            members={members}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
          />
        )}


    </div>
  )
}