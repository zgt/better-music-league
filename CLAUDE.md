# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A recreation of [musicleague.com](http://musicleague.com) — a social music competition platform. Built with the T3 Stack, deployed on Vercel.

## Commands

```bash
pnpm dev              # Start dev server (Next.js with Turbopack)
pnpm build            # Production build
pnpm check            # Lint + typecheck combined
pnpm lint             # ESLint only
pnpm lint:fix         # ESLint with auto-fix
pnpm typecheck        # TypeScript check only
pnpm format:check     # Prettier check
pnpm format:write     # Prettier auto-format

# Database
pnpm db:generate      # Create and apply migration (prisma migrate dev)
pnpm db:push          # Push schema directly without migration
pnpm db:migrate       # Apply migrations in production (prisma migrate deploy)
pnpm db:studio        # Open Prisma Studio GUI
./start-database.sh   # Start local PostgreSQL via Docker
```

## Architecture

**Stack**: Next.js 15 (App Router) + tRPC v11 + Prisma + Better Auth + Tailwind CSS v4 + pnpm

### Path alias

`~/` maps to `./src/` (configured in tsconfig.json).

### Auth (Better Auth with Discord OAuth)

- **Config**: `src/server/better-auth/config.ts` — Better Auth instance with Prisma adapter, email/password + Discord social provider
- **Server-side session**: `src/server/better-auth/server.ts` — `getSession()` (React `cache`-wrapped) for use in Server Components
- **Client-side**: `src/server/better-auth/client.ts` — `authClient` from `better-auth/react`
- **API route**: `src/app/api/auth/[...all]/route.ts` — catch-all handler via `toNextJsHandler`
- Auth tables (User, Session, Account, Verification) are in the Prisma schema and managed by Better Auth

### tRPC

- **Router definition**: `src/server/api/routers/` — add new routers here, register in `src/server/api/root.ts`
- **Procedures**: `publicProcedure` (unauthenticated) and `protectedProcedure` (requires session, provides `ctx.session.user`) defined in `src/server/api/trpc.ts`
- **Context**: Each request gets `{ db, session, headers }` — session is resolved via Better Auth
- **Client-side usage**: `import { api } from "~/trpc/react"` — standard `@trpc/react-query` hooks
- **Server Component usage**: `import { api, HydrateClient } from "~/trpc/server"` — call `api.router.procedure()` directly, prefetch with `api.router.procedure.prefetch()` and wrap with `<HydrateClient>`

### Database

- **PostgreSQL** via Prisma, client output at `generated/prisma/` (excluded from tsconfig)
- **DB client**: `src/server/db.ts` — singleton PrismaClient (`db`)
- Import the client from `../../generated/prisma` (not `@prisma/client`)

### Environment Variables

- Validated at build time via `@t3-oss/env-nextjs` in `src/env.js`
- Required: `DATABASE_URL`, `BETTER_AUTH_BASE_URL`, `BETTER_AUTH_DISCORD_CLIENT_ID`, `BETTER_AUTH_DISCORD_CLIENT_SECRET`
- `BETTER_AUTH_SECRET` required in production only
- Skip validation with `SKIP_ENV_VALIDATION=true`

### ESLint

Uses flat config (`eslint.config.js`) with `typescript-eslint` recommended + type-checked rules. Key settings:
- Prefers `type` keyword for imports (`consistent-type-imports`)
- Unused vars with `_` prefix allowed
- `require-await` disabled
