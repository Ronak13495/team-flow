// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TeamFlow",
  description: "Project management for modern teams",
}
// metadata is a Next.js convention — export this object from any
// layout or page to set the browser tab title and meta description.
// It only works in Server Components (no "use client" at the top).

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}