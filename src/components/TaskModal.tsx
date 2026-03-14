// src/components/TaskModal.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import type { Task, TaskStatus, TaskPriority } from "@/types"

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Comment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
}


type TaskModalProps = {
  task: Task
  projectId: string
  members: { id: string; name: string | null; email: string }[]
  onClose: () => void
  onUpdate: (updatedTask: Task) => void
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"]
const STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"]

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-red-50 text-red-600",
}

// Format a date string to "DD MMM YYYY" e.g. "12 Mar 2025"
function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// How long ago was this? e.g. "2 hours ago", "3 days ago"
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  // Date.now() returns current time in milliseconds
  // Subtracting gives us the difference in milliseconds

  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────

export default function TaskModal({
  task,
  projectId,
  members,
  onClose,
  onUpdate,
}: TaskModalProps) {
  const { data: session } = useSession()

  // Local editable state — we copy the task props into local state
  // so edits don't immediately affect the parent until saved
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? "")
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split("T")[0] : ""
    // .split("T")[0] converts "2025-03-15T00:00:00.000Z" to "2025-03-15"
    // which is the format HTML date inputs expect
  )

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [saveMessage, setSaveMessage] = useState<"saved" | "error" | null>(null)

  // isDirty compares current form values against this, not the original prop.
  const [baseTask, setBaseTask] = useState(task)

  // isDirty = true means the user has changed something that hasn't been saved yet.
  // Common pattern in forms — shows "Unsaved changes" and enables Save button.

  const commentsEndRef = useRef<HTMLDivElement>(null)
  // useRef creates a reference to a DOM element.
  // We use it to scroll to the bottom of comments after a new one is added.
  // Unlike useState, changing a ref does NOT trigger a re-render.

  // Fetch comments when modal opens
  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data)
      })
  }, [task.id, projectId])

  // Scroll to bottom whenever comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    // optional chaining ?. — if commentsEndRef.current is null, do nothing
    // scrollIntoView scrolls the element into the visible area of the browser
    // behavior: "smooth" animates the scroll instead of jumping
  }, [comments])

  // Close modal when user presses Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    // addEventListener attaches a function to run when the event fires.
    // We're listening for any keydown event on the whole document.

    return () => document.removeEventListener("keydown", handleKeyDown)
    // The return function is the "cleanup" — it runs when the component
    // unmounts (modal closes). Without cleanup, the event listener would
    // keep running even after the modal is gone, causing memory leaks.
  }, [onClose])

  //  Computed directly during render — no useEffect needed
// ✅ Compare against baseTask (last saved) not task (original prop)
const isDirty =
  title !== baseTask.title ||
  description !== (baseTask.description ?? "") ||
  priority !== baseTask.priority ||
  status !== baseTask.status ||
  assigneeId !== (baseTask.assignee?.id ?? "") ||
  dueDate !== (baseTask.dueDate ? baseTask.dueDate.split("T")[0] : "")

async function handleSave() {
  setIsSaving(true)
  setSaveMessage(null)

  console.log("Saving with dueDate:", dueDate)

  const res = await fetch(
    `/api/projects/${projectId}/tasks/${task.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        priority,
        status,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      }),
    }
  )

  if (res.ok) {
    const updated = await res.json()
    onUpdate(updated)

    // Update baseTask to the freshly saved version so isDirty
    // resets to false and won't reappear after saving
    setBaseTask(updated)

    setSaveMessage("saved")
    setTimeout(() => setSaveMessage(null), 2000)
  } else {
    setSaveMessage("error")
    setTimeout(() => setSaveMessage(null), 3000)
  }

  setIsSaving(false)
}

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setIsPostingComment(true)

    const res = await fetch(
      `/api/projects/${projectId}/tasks/${task.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      }
    )

    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setNewComment("")
    }

    setIsPostingComment(false)
  }

  return (
    // Backdrop — the dark overlay behind the modal
    // Clicking it closes the modal (clicking outside to dismiss)
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-6 overflow-y-auto"
      onClick={onClose}
      // fixed inset-0 = position fixed, stretch to all 4 edges of the viewport
      // z-50 = high z-index so it appears above everything else
      // bg-black/50 = black with 50% opacity
    >
      {/* Modal panel — stop click propagation so clicking INSIDE
          the modal doesn't trigger the backdrop's onClose */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className=" text-xl font-semibold text-gray-900 flex-1 mr-4 bg-transparent border-0 outline-none focus:bg-gray-50 rounded px-1 -mx-1 transition-colors"
            // bg-transparent border-0 outline-none makes it look like
            // plain text until focused, then shows a subtle background
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-6">
          {/* Left column — description + comments */}
          <div className="col-span-2 flex flex-col gap-5">
            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={4}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                Comments ({comments.length})
              </label>

              {/* Comment thread */}
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto mb-3 pr-1">
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                )}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {/* Author avatar */}
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {comment.author.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author.name ?? comment.author.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
                {/* This empty div is our scroll target */}
                <div ref={commentsEndRef} />
              </div>

              {/* New comment input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="text-gray-900 placeholder:text-gray-400 flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isPostingComment || !newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              </form>
            </div>
          </div>

          {/* Right column — metadata fields */}
          <div className="flex flex-col gap-4">

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="text-gray-900 placeholder:text-gray-400 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                    {/* "IN_PROGRESS" → "IN PROGRESS" */}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <div className="flex flex-col gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium text-left transition-all border-2 ${
                      priority === p
                        ? `${PRIORITY_STYLES[p]} border-current`
                        : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="text-gray-900 placeholder:text-gray-400 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name ?? member.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-gray-900 placeholder:text-gray-400 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {dueDate && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(dueDate)}
                </p>
              )}
            </div>

     {/* Save button — only show when something changed */}
    {isDirty && (
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    )}

    {/* Feedback messages */}
    {saveMessage === "saved" && (
      <div className="flex items-center justify-center gap-1.5 text-sm text-green-600 bg-green-50 py-2 rounded-lg">
        <span>✓</span>
        <span>Changes saved</span>
      </div>
      // This div appears for 2 seconds then disappears automatically
      // because setSaveMessage(null) runs in the setTimeout above
    )}

    {saveMessage === "error" && (
      <div className="flex items-center justify-center gap-1.5 text-sm text-red-600 bg-red-50 py-2 rounded-lg">
        <span>✕</span>
        <span>Failed to save</span>
      </div>
    )}

    {isDirty && !isSaving && !saveMessage && (
      <p className="text-xs text-center text-amber-500">
        Unsaved changes
      </p>
    )}
          </div>
        </div>
      </div>
    </div>
  )
}