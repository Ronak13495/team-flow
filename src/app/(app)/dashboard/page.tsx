// src/app/(app)/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import type {  DashboardStats, OrgMembership } from "@/types"

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-16" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
      <div className="h-4 bg-gray-100 rounded w-40 animate-pulse mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-64" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-64" />
      </div>
    </div>
  )
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${percent}%` }}
        // We use inline style here because Tailwind can't handle
        // dynamic values like w-[67%] at runtime — the class would
        // need to be known at build time. Inline style is the
        // correct approach for truly dynamic CSS values.
      />
    </div>
  )
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-red-50 text-red-600",
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orgs, setOrgs] = useState<OrgMembership[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return

    // Fetch both in parallel using Promise.all
    // Instead of waiting for orgs THEN stats (sequential),
    // Promise.all fires both requests at the same time and waits
    // for BOTH to complete. Much faster — saves one full round trip.
    Promise.all([
      fetch("/api/organisations").then((r) => r.json()),
      fetch("/api/dashboard/stats").then((r) => r.json()),
    ]).then(([orgsData, statsData]) => {
      if (Array.isArray(orgsData)) setOrgs(orgsData)
      if (statsData.summary) setStats(statsData)
      setIsLoading(false)
    })
  }, [status])

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    const res = await fetch("/api/organisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrgName }),
    })

    if (res.ok) {
      const org = await res.json()
      setOrgs((prev) => [...prev, { organisation: org, role: "OWNER" }])
      setNewOrgName("")
      setIsCreating(false)
    }
    setIsSaving(false)
  }

  if (status === "loading" || isLoading) return <DashboardSkeleton />

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {session?.user?.name} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here&#39;s what&#39;s happening across your projects
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + New Organisation
        </button>
      </div>

      {/* Create org form */}
      {isCreating && (
        <form
          onSubmit={handleCreateOrg}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        >
          <h2 className="font-semibold text-gray-900 mb-4">
            Create Organisation
          </h2>
          <input
            type="text"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="text-gray-900 placeholder:text-gray-400 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving || !newOrgName.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSaving ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Summary stat cards ── */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active Projects"
              value={stats.summary.totalProjects}
              color="text-blue-600"
            />
            <StatCard
              label="Total Tasks"
              value={stats.summary.totalTasks}
              sub={`${stats.summary.completionPercent}% complete`}
              color="text-gray-900"
            />
            <StatCard
              label="Completed"
              value={stats.summary.doneTasks}
              color="text-green-600"
            />
            <StatCard
              label="Overdue"
              value={stats.summary.overdueTasks}
              color={
                stats.summary.overdueTasks > 0
                  ? "text-red-500"
                  : "text-gray-400"
              }
              // Only show red if there are actually overdue tasks
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* ── Project progress ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Project Progress
              </h2>
              {stats.projectStats.length === 0 ? (
                <p className="text-gray-400 text-sm">No active projects yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.projectStats.map((project) => (
                    <div key={project.id}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          {project.name}
                        </p>
                        <span className="text-xs text-gray-400">
                          {project.done}/{project.total} done
                        </span>
                      </div>
                      <ProgressBar percent={project.progressPercent} />
                      {/* Task breakdown pills */}
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">
                          {project.todo} todo
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-blue-400">
                          {project.inProgress} in progress
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-green-500">
                          {project.done} done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── My tasks ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Assigned to Me
              </h2>
              {stats.myTasks.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No tasks assigned to you.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.myTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== "DONE"

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        // last:border-0 removes the bottom border
                        // from the last item — a common Tailwind pattern
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {task.project.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              PRIORITY_COLORS[task.priority]
                            }`}
                          >
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span
                              className={`text-xs ${
                                isOverdue
                                  ? "text-red-500 font-medium"
                                  : "text-gray-400"
                              }`}
                            >
                              {new Date(task.dueDate).toLocaleDateString(
                                "en-AU",
                                { day: "numeric", month: "short" }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {stats.myTasks.length === 5 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      Showing 5 most urgent tasks
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Organisations list ── */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">
          Your Organisations
        </h2>
        {orgs.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-4">
              You have no organisations yet.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-blue-600 font-medium hover:underline cursor-pointer"
            >
              Create your first one →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(({ organisation, role }) => {
              // Find this org's stats from projectStats
              const orgProjects = stats?.projectStats ?? []
              const orgTaskCount = orgProjects.reduce(
                (sum, p) => sum + p.total,
                0
              )

              return (
                <div
                  key={organisation.id}
                  onClick={() =>
                    router.push(`/org/${organisation.slug}`)
                  }
                  className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {organisation.name[0].toUpperCase()}
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {organisation.name}
                      </h3>
                    </div>
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {role}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-xs text-gray-500">
                      {orgProjects.length} project
                      {orgProjects.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-500">
                      {orgTaskCount} task
                      {orgTaskCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}