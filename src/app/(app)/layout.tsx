// src/app/(app)/layout.tsx
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Sidebar from "@/components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const router = useRouter()

  // This layout is the single place that protects ALL authenticated pages.
  // Instead of adding an auth check to every page individually,
  // we do it once here. Any page inside (app)/ is automatically protected.
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          {/* animate-spin is a Tailwind class that rotates the element
              continuously — creates a CSS-only loading spinner */}
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null
  // Return null while the redirect is happening —
  // prevents a flash of the authenticated layout

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      {/* Main content area — overflow-y-auto makes only this
          section scroll, not the whole page including the sidebar */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}