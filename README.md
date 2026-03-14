# TeamFlow

A full-stack SaaS project management application built with Next.js 14, TypeScript, Prisma, and PostgreSQL. Built as a portfolio project to demonstrate modern full-stack development practices.

🔗 **Live demo:** https://splendid-mandazi-50e343.netlify.app
> Demo credentials — Email: `test@gmail.com` · Password: `12345678`

---

## Features

- **Authentication** — Email/password sign up and login with Auth.js (JWT sessions)
- **Organisations** — Create workspaces and manage team members with role-based access control (Owner, Admin, Member)
- **Projects** — Create and manage projects within an organisation
- **Kanban Board** — Visual task board with To Do, In Progress, and Done columns
- **Task Management** — Create, move, and delete tasks with priority levels, assignees, due dates, and comments
- **Dashboard** — Overview of project progress, task completion stats, and tasks assigned to you
- **Responsive Layout** — Collapsible sidebar navigation

---

## Tech Stack

### Frontend
- [Next.js 14](https://nextjs.org) — App Router, Server Components, API Routes
- [TypeScript](https://www.typescriptlang.org) — Type safety throughout
- [TailwindCSS](https://tailwindcss.com) — Utility-first styling
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) — Form handling and validation

### Backend
- [Prisma 7](https://www.prisma.io) — Type-safe ORM with PostgreSQL adapter
- [PostgreSQL](https://www.postgresql.org) — Relational database (hosted on Neon)
- [Auth.js v5](https://authjs.dev) — Authentication and session management
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Password hashing

### Infrastructure
- [Neon](https://neon.tech) — Serverless PostgreSQL
- [Netlify](https://netlify.com) — Deployment and hosting

---

## Database Schema
```
User ──── OrganisationMember ──── Organisation
                                       │
                                    Project
                                       │
                                      Task ──── Comment
```

Key design decisions:
- **Join table** (`OrganisationMember`) for the User ↔ Organisation many-to-many relationship with role stored on the join
- **Soft deletes** on tasks (`deletedAt`) for auditability and undo capability
- **Position field** on tasks for ordered display within status columns
- **Enum types** for `MemberRole`, `TaskStatus`, and `TaskPriority` for data integrity

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Installation
```bash
# Clone the repo
git clone https://github.com/yourusername/teamflow.git
cd teamflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, and NEXTAUTH_URL

# Push the database schema
npx prisma db push

# Generate the Prisma client
npx prisma generate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables
```
DATABASE_URL        = PostgreSQL connection string (direct)
NEXTAUTH_SECRET     = Random secret for signing sessions (openssl rand -base64 32)
NEXTAUTH_URL        = http://localhost:3000 (or your production URL)
AUTH_SECRET         = Same value as NEXTAUTH_SECRET
```

---

## Project Structure
```
src/
├── app/
│   ├── (app)/              # Authenticated pages (protected by layout)
│   │   ├── dashboard/      # Dashboard with stats
│   │   └── org/[slug]/     # Organisation workspace + Kanban board
│   ├── (auth)/             # Public pages
│   │   ├── login/
│   │   └── register/
│   └── api/                # API routes
│       ├── auth/           # Auth.js handlers + registration
│       ├── organisations/  # Org CRUD + member management
│       ├── projects/       # Project + task CRUD
│       └── dashboard/      # Stats aggregation
├── components/
│   ├── Sidebar.tsx
│   └── TaskModal.tsx
├── lib/
│   ├── auth.ts             # Auth.js configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── services/           # Database service layer
│       └── organisation.ts
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## Key Concepts Demonstrated

- **Next.js App Router** — layouts, route groups, Server vs Client Components
- **Role-Based Access Control** — Owners and Admins can manage projects, Members can only view
- **Service layer pattern** — database logic separated from API route handlers
- **Optimistic UI updates** — task cards update instantly, sync with server in background
- **Prisma transactions** — atomic operations for creating org + membership together
- **Soft deletes** — tasks are never hard-deleted, `deletedAt` timestamp used instead
- **Type safety** — shared types across frontend and backend, no `any`

---

## Author

Built by Ronak (https://github.com/Ronak13495)