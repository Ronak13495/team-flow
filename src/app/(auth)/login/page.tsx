// src/app/login/page.tsx
"use client"
// "use client" tells Next.js this component runs in the browser.
// We need this because we're using hooks (useState, useForm)
// which only work on the client side.

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Define the form shape with Zod — same pattern as the API
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Infer the TypeScript type from the Zod schema.
// This means we don't define the type twice — Zod IS the type definition.
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // useForm gives us: register (connects inputs), handleSubmit (validates before submit),
  // formState.errors (validation error messages)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    // zodResolver connects react-hook-form to our Zod schema.
    // It runs Zod validation automatically when the form is submitted.
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError(null)

    // signIn() from next-auth/react sends credentials to our authorize()
    // function in auth.ts. redirect: false means we handle the redirect
    // ourselves instead of letting Auth.js redirect automatically.
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

    // Success — send them to the dashboard
    router.push("/dashboard")
    router.refresh()
    // router.refresh() re-fetches server components so the header
    // updates to show the logged-in state immediately
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-sm mb-4 text-red-500"> For testing use test@gmail.com as email and 12345678 as password</div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">Sign in to your TeamFlow account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              // {...register("email")} connects this input to react-hook-form.
              // It adds onChange, onBlur, name, and ref automatically.
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Show Zod validation error if email is invalid */}
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Show server-side error (wrong password etc) */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&#39;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}