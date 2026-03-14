// src/components/Sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

type Org = {
  organisation: {
    id: string
    name: string
    slug: string
  }
  role: string
}

export default function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  // usePathname() returns the current URL path e.g. "/org/acme-corp"
  // We use it to highlight the active nav item

  const [orgs, setOrgs] = useState<Org[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  // isCollapsed lets the user hide the sidebar to get more screen space

  useEffect(() => {
    fetch("/api/organisations")
      .then((r) => r.json())
      .then((data) => {
        // Guard against the API returning an error object instead of array
        if (Array.isArray(data)) setOrgs(data)
      })
  }, [])

  // Helper — checks if a path is the currently active route
  // Used to highlight the correct nav item
  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/")
  }

  return (
    <aside
      className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo + collapse button */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        {!isCollapsed && (
          <span className="font-bold text-lg tracking-tight">
            Team<span className="text-blue-400">Flow</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Simple hamburger/arrow icon using text */}
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Dashboard link */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
            isActive("/dashboard")
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <span className="text-base">⊞</span>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* Organisations section */}
        {!isCollapsed && orgs.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Organisations
            </p>
            {orgs.map(({ organisation, role }) => (
              <Link
                key={organisation.id}
                href={`/org/${organisation.slug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                  isActive(`/org/${organisation.slug}`)
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {/* Org avatar — first letter of org name in a coloured square */}
                <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {organisation.name[0].toUpperCase()}
                </span>
                <span className="truncate">{organisation.name}</span>
                {/* truncate cuts off long names with "..." */}
              </Link>
            ))}
          </div>
        )}

        {/* Collapsed org icons */}
        {isCollapsed && orgs.map(({ organisation }) => (
          <Link
            key={organisation.id}
            href={`/org/${organisation.slug}`}
            title={organisation.name}
            // title shows the org name as a tooltip when collapsed
            className={`flex items-center justify-center py-2 rounded-lg mb-1 transition-colors ${
              isActive(`/org/${organisation.slug}`)
                ? "bg-blue-600"
                : "hover:bg-gray-800"
            }`}
          >
            <span className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
              {organisation.name[0].toUpperCase()}
            </span>
          </Link>
        ))}
      </nav>

      {/* User section at the bottom */}
      <div className="border-t border-gray-800 p-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            {/* User avatar — initials */}
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
              {/* Optional chaining all the way down —
                  session might be null, user might be null,
                  name might be null. The ?? "?" is the fallback. */}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              // callbackUrl tells Auth.js where to redirect after sign out
              title="Sign out"
              className="text-gray-400 hover:text-red-400 transition-colors text-sm"
            >
              ⏻
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="w-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors py-1"
          >
            ⏻
          </button>
        )}
      </div>
    </aside>
  )
}