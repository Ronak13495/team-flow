// src/app/(auth)/login/page.tsx
"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

// The three states the animated badge cycles through
const BADGE_STATES = [
  {
    text: "To Do",
    bg: "bg-orange-50",
    text_color: "text-orange-700",
    dot: "bg-orange-500",
  },
  {
    text: "In Progress",
    bg: "bg-blue-50",
    text_color: "text-blue-700",
    dot: "bg-blue-500",
  },
  {
    text: "Done",
    bg: "bg-green-50",
    text_color: "text-green-700",
    dot: "bg-green-500",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Tracks which badge state is currently visible
  const [badgeIndex, setBadgeIndex] = useState(0)
  // Controls fade animation — false = fading out, true = visible
  const [badgeVisible, setBadgeVisible] = useState(true)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Cycle through badge states every 1800ms
  useEffect(() => {
    const interval = setInterval(() => {
      // Step 1: fade out
      setBadgeVisible(false)

      // Step 2: after fade-out completes (300ms), swap text and fade in
      setTimeout(() => {
        setBadgeIndex((i) => (i + 1) % BADGE_STATES.length)
        setBadgeVisible(true)
      }, 300)
    }, 2800)

    return () => clearInterval(interval)
    // Cleanup — stop the interval when the component unmounts
    // (e.g. when user navigates away). Without this, the interval
    // keeps running in the background causing memory leaks.
  }, [])

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError(null)

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  const badge = BADGE_STATES[badgeIndex]

  return (
    <>
      <div
        className="tf-outfit min-h-screen flex items-center justify-center p-6"
        style={{ background: "#e8edf8" }}
      >
        <div
          className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 8px 48px rgba(67,97,238,0.12)" }}
        >

          {/* ── LEFT PANEL ── */}
          <div
            className="relative flex flex-col justify-between p-12 overflow-hidden"
            style={{ background: "#eef2ff", borderRight: "1px solid #dde5ff" }}
          >
            {/* Decorative background glows */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 320, height: 320,
                background: "radial-gradient(circle, rgba(67,97,238,0.1) 0%, transparent 70%)",
                bottom: -80, right: -80,
              }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 200, height: 200,
                background: "radial-gradient(circle, rgba(67,97,238,0.07) 0%, transparent 70%)",
                top: -40, left: -40,
              }}
            />

            {/* Logo */}
            <div
              className="tf-syne relative z-10 text-3xl font-bold"
              style={{ color: "#1e2b6e", letterSpacing: "-0.3px" }}
            >
              Team<span style={{ color: "#4361ee" }}>Flow</span>
            </div>

            {/* Middle content */}
            <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
              {/* Tag */}
              <div
                className="inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1.5 mb-5 w-fit"
                style={{
                  background: "#dde5ff",
                  color: "#4361ee",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <div
                  className="rounded-full"
                  style={{ width: 5, height: 5, background: "#4361ee" }}
                />
                Project Management
              </div>

              {/* Heading with animated badge */}
              <h2
                className="tf-syne font-bold mb-2"
                style={{ fontSize: 34, color: "#1e2b6e", letterSpacing: "-0.8px", lineHeight: 1.1 }}
              >
                Your work,
              </h2>

              {/* Animated status badge */}
              <div
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-5 w-fit tf-syne font-bold ${badge.bg} ${badge.text_color}`}
                style={{
                  fontSize: 30,
                  letterSpacing: "-0.5px",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  opacity: badgeVisible ? 1 : 0,
                  transform: badgeVisible ? "translateY(0)" : "translateY(-8px)",
                }}
              >
                <div className={`rounded-full shrink-0 ${badge.dot}`} style={{ width: 8, height: 8 }} />
                {badge.text}
              </div>

              <p
                className="tf-outfit mb-8"
                style={{ fontSize: 16, color: "#7284b8", fontWeight: 300, lineHeight: 1.6 }}
              >
                Manage projects, assign tasks,<br />
                and ship with your team — faster.
              </p>

              {/* Feature list */}
              <div className="flex flex-col gap-3">
                {[
                  { icon: "⊞", text: "Kanban boards for every project" },
                  { icon: "👥", text: "Team workspaces with roles" },
                  { icon: "✓", text: "Task tracking with due dates" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3" style={{ fontSize: 13, color: "#5a6fa8" }}>
                    <div
                      className="flex items-center justify-center rounded-lg text-sm shrink-0"
                      style={{
                        width: 28, height: 28,
                        background: "#fff",
                        border: "1px solid #dde5ff",
                        boxShadow: "0 1px 4px rgba(67,97,238,0.08)",
                      }}
                    >
                      {f.icon}
                    </div>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="bg-white flex flex-col justify-center p-12">
            <h1
              className="tf-syne font-bold mb-1"
              style={{ fontSize: 24, color: "#1e2b6e" }}
            >
              Welcome back
            </h1>
            <p
              className="tf-outfit mb-6"
              style={{ fontSize: 13, color: "#aab4cc", fontWeight: 300 }}
            >
              Sign in to continue to TeamFlow
            </p>

            {/* Demo notice */}
            <div
              className="flex items-start gap-2 rounded-xl p-3 mb-6"
              style={{ background: "#f0f4ff", border: "1px solid #c8d4ff" }}
            >
              <div
                className="flex items-center justify-center rounded-full text-white shrink-0 font-bold"
                style={{ width: 16, height: 16, background: "#4361ee", fontSize: 10, marginTop: 1 }}
              >
                i
              </div>
              <p style={{ fontSize: 12, color: "#4361ee", lineHeight: 1.5 }}>
                Demo account <br />
                Email:{" "}
                <code
                  style={{
                    background: "#dde5ff",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontSize: 11,
                    color: "#2d4acc",
                  }}
                >
                  test@gmail.com
                </code>
                {" "}· Password:{" "}
                <code
                  style={{
                    background: "#dde5ff",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontSize: 11,
                    color: "#2d4acc",
                  }}
                >
                  12345678
                </code>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label
                  className="block mb-1.5"
                  style={{ fontSize: 12, fontWeight: 500, color: "#8896b8" }}
                >
                  Email address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    border: "1.5px solid #e8edf8",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 16,
                    color: "#1e2b6e",
                    background: "#f8faff",
                    outline: "none",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  className="block mb-1.5"
                  style={{ fontSize: 12, fontWeight: 500, color: "#8896b8" }}
                >
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    border: "1.5px solid #e8edf8",
                    borderRadius: 10,
                    padding: "11px 14px",
                    fontSize: 16,
                    color: "#1e2b6e",
                    background: "#f8faff",
                    outline: "none",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div
                  className="text-sm px-4 py-3 rounded-xl"
                  style={{ background: "#fff0f0", color: "#c0392b" }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: "#4361ee",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "13px",
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  fontFamily: "'Outfit', sans-serif",
                  marginTop: 4,
                  transition: "background 0.2s",
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div
              className="my-5"
              style={{ height: 1, background: "#f0f2f8" }}
            />

            <p
              className="text-center"
              style={{ fontSize: 13, color: "#aab4cc" }}
            >
              Don&#39;t have an account?{" "}
              <Link
                href="/register"
                style={{ color: "#4361ee", fontWeight: 500, textDecoration: "none" }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}