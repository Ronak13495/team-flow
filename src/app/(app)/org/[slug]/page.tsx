// src/app/org/[slug]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"

// useParams() reads the dynamic segment from the URL.
// If URL is /org/acme-corp, then params.slug === "acme-corp"

type Member = {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  dueDate: string | null
}

type Organisation = {
  id: string
  name: string
  slug: string
  members: Member[]
  projects: Project[]
}

export default function OrgPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [org, setOrg] = useState<Organisation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"projects" | "members">("projects")

  // Project creation state
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [isSaving, setIsSaving] = useState(false)


  // Fetch org data when slug is available and user is authenticated
  useEffect(() => {
    if (status !== "authenticated" || !slug) return

    fetch(`/api/organisations/${slug}`)
      .then((res) => {
        // If the user isn't a member, the API returns 403
        // Redirect them back to dashboard
        if (res.status === 403) {
          router.push("/dashboard")
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setOrg(data)
        setIsLoading(false)
      })
  }, [status, slug, router])

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!org) return
    setIsSaving(true)

    const res = await fetch(`/api/organisations/${slug}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDesc,
      }),
    })

    if (res.ok) {
      const project = await res.json()
      // Add new project to local state immediately
      setOrg((prev) =>
        prev ? { ...prev, projects: [...prev.projects, project] } : prev
      )
      // ☝️ The spread operator ...prev copies all existing org fields,
      // then we overwrite just the projects array with the new one added.
      // This is called "immutable state update" — never mutate state directly.
      setNewProjectName("")
      setNewProjectDesc("")
      setIsCreatingProject(false)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading workspace...</p>
      </div>
    )
  }

  if (!org) return null

  // Find the current user's role in this org
  const myRole = org.members.find(
    (m) => m.user.id === session?.user?.id
  )?.role
  // ☝️ Optional chaining ?.role — if find() returns undefined, we get
  // undefined instead of a crash

  const isAdmin = myRole === "OWNER" || myRole === "ADMIN"
  // isAdmin controls whether we show "New Project" and member management buttons

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Dashboard
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="font-semibold text-gray-900">{org.name}</h1>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {myRole}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-8">
          {(["projects", "members"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {/* Show count badge next to each tab */}
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {tab === "projects" ? org.projects.length : org.members.length}
              </span>
            </button>
          ))}
        </div>

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-lg">Projects</h2>
              {isAdmin && (
                <button
                  onClick={() => setIsCreatingProject(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + New Project
                </button>
              )}
            </div>

            {/* New project form */}
            {isCreatingProject && (
              <form
                onSubmit={handleCreateProject}
                className="bg-white border border-gray-200 rounded-xl p-6 mb-4"
              >
                <h3 className="font-medium text-gray-900 mb-4">
                  New Project
                </h3>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  autoFocus
                />
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSaving || !newProjectName.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? "Creating..." : "Create Project"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Project list */}
            {org.projects.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                <p className="text-gray-500">No projects yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => setIsCreatingProject(true)}
                    className="text-blue-600 text-sm font-medium hover:underline mt-2"
                  >
                    Create your first project →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {org.projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() =>
                      router.push(`/org/${slug}/projects/${project.id}`)
                    }
                    className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          project.status === "ACTIVE"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div>
            <h2 className="font-semibold text-gray-900 text-lg mb-4">
              Members ({org.members.length})
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {org.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user.name ?? "Unnamed User"}
                      {/* ?? is the "nullish coalescing" operator —
                          if name is null/undefined, show "Unnamed User" */}
                      {member.user.id === session?.user?.id && (
                        <span className="text-gray-400 text-sm ml-2">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-gray-500 text-sm">{member.user.email}</p>
                  </div>
                  <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}