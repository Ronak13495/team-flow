// src/lib/prisma.ts

import { PrismaClient } from "@/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

// PrismaPg is the adapter that connects Prisma 7 to PostgreSQL.
// It takes your connection string and handles all the low-level
// database communication using Node's native pg library.
// This replaces Prisma's old Rust-based query engine entirely.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  // The ! tells TypeScript "I guarantee this won't be undefined"
  // It will be defined because we set it in .env and .env.local
})

declare global {
  var prisma: PrismaClient | undefined
}

// Now we pass the adapter to PrismaClient — this is mandatory in Prisma 7
// when connecting directly to PostgreSQL (not using Prisma Accelerate)
const prisma = globalThis.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}

export default prisma