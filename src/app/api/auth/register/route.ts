// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma"

// Zod schema for registration — stricter than login
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// This function handles POST requests to /api/auth/register
export async function POST(request: Request) {
  try {
    // 1. Parse the JSON body from the request
    const body = await request.json()

    // 2. Validate the body against our schema
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      // Return validation errors to the client
      // .flatten() converts Zod's error format into a readable object
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }  // 400 = Bad Request
      )
    }

    const { name, email, password } = parsed.data

    // 3. Check if this email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }  // 409 = Conflict
      )
    }

    // 4. Hash the password before saving.
    // The 12 is the "salt rounds" — higher = more secure but slower.
    // 12 is the industry standard balance of security vs performance.
    const hashedPassword = await bcrypt.hash(password, 12)

    // 5. Create the user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
      // Only return these fields — never return hashedPassword to the client
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // 6. Return the new user with 201 Created status
    return NextResponse.json(user, { status: 201 })

  } catch (error) {
    // Catch any unexpected errors (network, database down, etc.)
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }  // 500 = Internal Server Error
    )
  }
}