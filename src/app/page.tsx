// src/app/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()

  // If logged in → go straight to dashboard
  // If not → go to login
  // This makes "/" always send you somewhere useful
  if (session) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}