// src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/lib/auth"

// handlers contains GET and POST functions that Auth.js needs.
// By exporting them here, Next.js automatically handles all
// auth-related HTTP requests at these URLs:
//   GET  /api/auth/session    ← checks if user is logged in
//   POST /api/auth/signin     ← processes login
//   POST /api/auth/signout    ← processes logout
//   GET  /api/auth/csrf       ← security token for forms
export const { GET, POST } = handlers