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

## Current Phase Status

| Feature | Status |
|---|---|
| Email/OTP (Resend) | Done — `lib/email.ts` |
| File uploads (Cloudflare R2) | Done — `lib/storage.ts`, `POST /api/upload` |
| Payment gateway (SSLCommerz sandbox) | Done — `lib/payments/sslcommerz.ts` |
| Certificates (HTML) | Done — `lib/certificates.ts` |
| Google OAuth | Done — awaiting credentials in Vercel env |
| AI MCQ Generator (RAG pipeline) | Not started — `apps/ai-service` stub |
| PDF Certificates | Not started — currently HTML |
| Bangla i18n | Not started |
| Video DRM / signed URLs | Not started |

## Role System

```
enum Role {
  STUDENT      // Default — no admin access
  TEACHER      // Future: teacher dashboard
  MODERATOR    // Limited admin access (students, question bank, materials)
  ADMIN        // Full admin access except managing other admins
  SUPER_ADMIN  // Full access + can manage all roles
}
```

### Auth Helpers (`lib/api-utils.ts`)
- `requireAuth()` — any authenticated user
- `requireStaff()` — `ADMIN | SUPER_ADMIN | MODERATOR | TEACHER`
- `requireAdmin()` — `ADMIN | SUPER_ADMIN` (for destructive actions, role changes)

### Role Management
- `PATCH /api/admin/students/[id]` accepts `role` with enum validation
- SUPER_ADMIN protection: ADMIN cannot modify SUPER_ADMIN, only SUPER_ADMIN can promote to SUPER_ADMIN
- UI: `/admin/students` (Users page) — role dropdown per user row

## Design System

Design direction: **Academic Heritage meets Modern Clarity** — a prestigious institutional feel with modern edtech usability. Navy + Saffron palette, Georgia/Inter/JetBrains Mono type, hexagonal brand motif.

### Colors

| Token | Value | Tailwind Class | Role |
|---|---|---|---|
| **Navy** | `#0F2B46` | `bg-navy`, `text-navy` | Primary — backgrounds, nav, headers |
| **Saffron** | `#D4781A` | `bg-saffron`, `text-saffron` | Accent — CTAs, highlights, active states |
| **Parchment** | `#FAF7F2` | `bg-parchment` | Surface — cards, page backgrounds |
| **Ink** | `#1A1D20` | `text-ink` | Text — body copy, headings |
| **Stone** | `#E8E4DF` | `border-stone-token` | Borders, dividers, muted elements |
| **Verdant** | `#1A7540` | `text-verdant` | Success — pass rates, correct answers |

### Typography

| Role | Font | Usage |
|---|---|---|
| Display | Georgia (serif) | h1, hero headlines, brand moments |
| Body | Inter (sans-serif) | UI controls, forms, nav, paragraphs |
| Code | JetBrains Mono (monospace) | Timer displays, scores, stats, IDs |

### Signature Element: The Hexagon

The logo's hexagonal shape is reused as a decorative motif:
- Section dividers, loading states, empty state containers
- Never for functional controls (buttons, inputs, links)
- CSS utility: `hex-decoration` class for decorative hex outline

### Hard Rules
- **NEVER** hardcode any color as a hex string in JSX — always use Tailwind tokens
- **NEVER** use `shadow-lg` or `hover:shadow-xl` on cards — `shadow-sm` only
- **NEVER** use `bg-muted`, `bg-gray-*` for section backgrounds — use parchment or navy
- **NEVER** use 01/02/03 numbered markers unless content is genuinely sequential
- Card backgrounds are `bg-parchment` with 1px `border-stone-token`, never `bg-card`

## Frontend Redesign Roadmap

### Phase A: Foundation (tokens + globals)
- [ ] CSS variables for 6 color tokens in `globals.css`
- [ ] `tailwind.config.ts` updated with navy/saffron/parchment/ink/stone/verdant
- [ ] Georgia display font loaded via `next/font`
- [ ] All hardcoded `#185FA5` references (~15 files) replaced with tokens
- [ ] Hexagonal CSS utility classes (`hex-decoration`, `hex-loading`, `hex-empty`)

### Phase B: Navigation & Shell
- [ ] Navbar — navy background, saffron active underline, hexagonal avatar crop
- [ ] Footer — navy background, cleaner 3-column layout
- [ ] Admin Navbar — distinct from student, denser, ink-on-parchment
- [ ] Admin Sidebar — ink-on-parchment, saffron active states

### Phase C: Landing Page
- [ ] Hero — full-bleed navy, Georgia headline, background hexagon motif at 8% opacity
- [ ] Stats strip — horizontal rule layout, monospace numbers
- [ ] Features section — parchment cards, saffron icon containers
- [ ] Course preview cards — bordered left stripe (color-coded by subject)

### Phase D: Core Student Pages
- [ ] Login / Signup / OTP pages — parchment centered cards, navy header
- [ ] Dashboard — hexagonal stat indicators, monospace numbers
- [ ] Courses list & detail — subject-coded left border stripes on cards
- [ ] Profile page — hexagonal avatar crop, cleaner layout
- [ ] Exam take interface — full-bleed dark, JetBrains Mono timer, minimal chrome

### Phase E: Admin Panel
- [ ] Admin Dashboard — ink-on-parchment, compact stat cards
- [ ] All list pages — cleaner tables, monospace data cells
- [ ] Create/Edit forms — sharper input radius, cleaner label spacing

### Phase F: Polish
- [ ] Hexagonal loading skeletons (not rectangular)
- [ ] Empty states — hexagonal icon containers + action copy
- [ ] Page transitions + hover micro-interactions
- [ ] Error states — clear, actionable, in brand voice
- [ ] Mobile responsiveness pass — all pages reviewed at 320px
