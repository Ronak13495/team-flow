// src/lib/auth.ts

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

// This is the Zod schema for validating login form data.
// It runs BEFORE we touch the database — if the input is bad,
// we reject it immediately without wasting a database query.
const loginSchema = z.object({
  email: z.string().email(),        // must be a valid email format
  password: z.string().min(8),      // must be at least 8 characters
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  // The adapter connects Auth.js to YOUR database.
  // It automatically saves users, sessions, and accounts
  // to the tables we defined in schema.prisma
  adapter: PrismaAdapter(prisma),

  // "jwt" means sessions are stored in a cookie as a signed token,
  // NOT in the database. This is faster and works better with
  // Next.js serverless functions (Vercel).
  session: { strategy: "jwt" },

  // Pages lets you tell Auth.js where YOUR login page lives.
  // Without this it uses Auth.js's built-in (ugly) default pages.
  pages: {
    signIn: "/login",
  },

  providers: [
    // CredentialsProvider = email + password login.
    // This is the manual option where YOU control the logic.
    CredentialsProvider({
      // authorize() runs when someone submits the login form.
      // It receives the raw form data and must return either:
      //   - a user object (login succeeds)
      //   - null (login fails)
      async authorize(credentials) {
        // Step 1: Validate the shape of the incoming data with Zod
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        // safeParse returns { success: false } instead of throwing —
        // safer than parse() which throws on bad input

        const { email, password } = parsed.data

        // Step 2: Look up the user by email in our database
        const user = await prisma.user.findUnique({
          where: { email },
        })

        // Step 3: If no user found, or they have no password
        // (meaning they signed up with Google), reject login
        if (!user || !user.hashedPassword) return null

        // Step 4: Compare the submitted password against the stored hash.
        // NEVER store plain text passwords. bcrypt.compare() takes the
        // plain text and the hash and checks if they match securely.
        const passwordMatch = await bcrypt.compare(password, user.hashedPassword)
        if (!passwordMatch) return null

        // Step 5: Return the user — Auth.js creates a session for them
        return user
      },
    }),
  ],

  callbacks: {
    // The jwt() callback runs every time a JWT token is created or updated.
    // We add the user's ID to the token so we can access it anywhere.
    // Without this, the token only contains email — not enough for DB queries.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    // The session() callback runs every time we call auth() in a component.
    // We copy the ID from the token into the session object so our
    // frontend code can access session.user.id
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})