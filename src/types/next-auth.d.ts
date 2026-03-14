// src/types/next-auth.d.ts

// .d.ts files are "declaration files" — they contain only TypeScript
// type information, no actual runtime code.
// This file extends Auth.js's built-in types to add our custom fields
// (like the user id we added in the jwt/session callbacks in auth.ts)

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string        // we added this in the session callback in auth.ts
    } & DefaultSession["user"]
    // & means "merge with" — so Session.user gets our id field
    // PLUS everything Auth.js already puts there (name, email, image)
  }
}