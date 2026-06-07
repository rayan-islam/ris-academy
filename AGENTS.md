# AGENTS.md — RI's Academy

## Environment Setup

- **Node.js via nvm** — must be sourced before any command:
  ```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  ```
- **PostgreSQL** must be running on `localhost:5432`. Authenticate via TCP:
  ```bash
  PGPASSWORD=password psql -U postgres -h localhost -d ris_academy
  ```
  Ubuntu ships with `peer` auth for local sockets; use `-h localhost` to force TCP/md5.
- **DATABASE_URL** lives in `apps/web/.env.local` (the root `.env.example` is a template, never loaded). The URL is: `postgresql://postgres:password@localhost:5432/ris_academy`
- `packages/db/.env` must also exist with the same `DATABASE_URL` for direct `prisma` CLI calls. Copy it from `apps/web/.env.local` if missing.

## Essential Commands

| Task | Command (run from repo root unless noted) |
|---|---|
| Start dev server | `npm run dev` or `cd apps/web && npx next dev` |
| Production build | `cd apps/web && npx next build` |
| Type-check only | `cd apps/web && npx tsc --noEmit` |
| Push schema to DB | `cd packages/db && DATABASE_URL="…" npx prisma db push` |
| Generate Prisma client | `cd packages/db && npx prisma generate` |
| Seed demo data | `cd packages/db && DATABASE_URL="…" npx tsx seed.ts` |
| Reset DB | Drop via psql, then `npx prisma db push && npx tsx seed.ts` |

When `DATABASE_URL` is already in `packages/db/.env`, you can omit the explicit export.

## Architecture Rules

### Monorepo
- **Turborepo** with npm workspaces. All packages prefixed `@ris-academy/*`.
- `packages/db` — Prisma schema + client singleton (`index.ts`)
- `packages/ui` — shadcn/ui components (Button, Card, Dialog, etc.)
- `packages/types` — shared TypeScript interfaces
- `apps/web` — Next.js 14 App Router (frontend + API routes)
- `apps/ai-service` — Python FastAPI stub (Phase 3)

### API Route Auth Pattern
Every protected API route **must** use the shared auth helpers from `@/lib/api-utils`:

```ts
import { apiSuccess, apiError, requireAuth, requireAdmin, AuthError } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(); // throws AuthError if unauthenticated
    // or: const admin = await requireAdmin(); // throws AuthError if not admin
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal error', 500);
  }
}
```

**Never** define local `getCurrentUser()` functions or inline `getServerSession` checks in new routes. The `AuthError` throw pattern is required because Next.js route handlers must return `NextResponse`, not union types.

### Route Groups
- `(student)/` — shared layout with Navbar (all student pages)
- `admin/` — separate layout with AdminSidebar + AdminNavbar + role check
- Auth pages (`/login`, `/signup`) are at root level, no layout wrapper

### Middleware (`apps/web/middleware.ts`)
Protects: `/dashboard/*`, `/admin/*`, `/exams/*`, `/profile/*`, `/courses/*/learn`
Admin routes additionally check `token.role` for `ADMIN` or `SUPER_ADMIN`.

## TypeScript Gotchas

- **`noUncheckedIndexedAccess: true`** in `tsconfig.base.json` — array indexing returns `T | undefined`. Always null-check:
  ```ts
  const item = array[index];
  if (!item) return null;
  ```
- **NextAuth session** stores `role` via JWT callback. Type augmentation is at `apps/web/types/next-auth.d.ts`. Access via `(session.user as any).role` or cast.
- `transpilePackages` in `next.config.js` must list all `@ris-academy/*` workspace packages.
- `serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']` is required for Server Component / Route Handler usage.

## Database Gotchas

- **esbuild missing** — If `tsx seed.ts` fails with `"@esbuild/linux-x64" could not be found`, reinstall esbuild with optional deps:
  ```bash
  npm install --include=optional esbuild
  ```
  The initial `npm install` used `--omit=optional`.
- **Prisma enums** are PascalCase: `CourseType.FREE`, `Difficulty.EASY`, `Role.ADMIN`. Use `@prisma/client` enums, not string literals.
- Seed script **deletes all existing data** before inserting. Safe to re-run.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@risacademy.com | password123 |
| Teacher | rahim@risacademy.com | password123 |
| Student | karim@example.com | password123 |
| Student | fatema@example.com | password123 |

## Phase 1 Limitations

- No real email/OTP delivery (registration creates user directly, no email verification)
- No payment gateway integration (Payment model and routes are stubs)
- Video URLs are public YouTube embeds (no signed URLs / DRM)
- AI MCQ Generator is a Python stub; `/api/generate-mcqs` returns a placeholder
- English-only (no Bangla i18n)
- No file uploads to S3/R2
