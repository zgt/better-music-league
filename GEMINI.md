# Better Music League

## Project Overview
**Better Music League** is a web application designed to recreate and improve upon the "Music League" experience. It allows groups of friends to compete in social music discovery games. Users join leagues, submit songs based on a round's theme, listen to the curated playlist, and vote for their favorites to earn points and climb the leaderboard.

**Tech Stack (T3 Stack):**
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **Database:** PostgreSQL (via Prisma ORM)
*   **API:** tRPC v11 (Server Actions / React Query wrapper)
*   **Authentication:** Better Auth (Discord OAuth + Email/Password)
*   **Package Manager:** pnpm

## Building and Running

### Prerequisites
*   Node.js (LTS recommended)
*   pnpm (`npm install -g pnpm`)
*   Docker (for local database)

### Key Commands
*   **Install Dependencies:** `pnpm install`
*   **Start Local Database:** `./start-database.sh` (Runs Postgres via Docker)
*   **Start Development Server:** `pnpm dev` (Runs on `http://localhost:3000`)
*   **Production Build:** `pnpm build`
*   **Start Production Server:** `pnpm start`

### Database Management
*   **Push Schema (Dev):** `pnpm db:push` (Updates DB schema without creating migrations)
*   **Generate Migrations:** `pnpm db:generate`
*   **Apply Migrations (Prod):** `pnpm db:migrate`
*   **Open DB GUI:** `pnpm db:studio`
*   **Seed Database:** `pnpm db:seed`

### Code Quality
*   **Full Check (Lint + Types):** `pnpm check`
*   **Type Check Only:** `pnpm typecheck`
*   **Lint Only:** `pnpm lint`
*   **Format:** `pnpm format:write`

## Development Conventions

### Architecture
*   **Directory Structure:**
    *   `src/app`: Next.js App Router pages and layouts.
    *   `src/server/api`: tRPC backend logic (routers and procedures).
    *   `src/server/db.ts`: Prisma client instance.
    *   `src/components`: Reusable UI components (shadcn/ui based).
*   **Path Aliases:** Use `~/` to import from `src/` (e.g., `import { api } from "~/trpc/react"`).

### Database & Prisma
*   **Schema:** Defined in `prisma/schema.prisma`.
*   **Client Generation:** The Prisma client is generated to `generated/prisma/` (not the default node_modules path).
*   **Importing Client:** Always import the DB client from `~/server/db` or the types from `../../generated/prisma`. **Do not** import `@prisma/client` directly in application code.

### tRPC API
*   **Routers:** API logic is split into modular routers (e.g., `league.ts`, `round.ts`, `submission.ts`) located in `src/server/api/routers/`.
*   **Root Router:** All routers are merged in `src/server/api/root.ts`.
*   **Procedures:**
    *   `publicProcedure`: Accessible by anyone.
    *   `protectedProcedure`: Accessible only by authenticated users (provides `ctx.session.user`).

### Authentication
*   **Better Auth:** Configured in `src/server/better-auth/`.
*   **Session Access:**
    *   **Server Components:** `import { getSession } from "~/server/better-auth/server"`.
    *   **Client Components:** `import { authClient } from "~/server/better-auth/client"`.

### Environment Variables
*   Managed by `@t3-oss/env-nextjs` in `src/env.js`.
*   Ensure `.env` contains necessary keys (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_DISCORD_CLIENT_ID`, etc.).
