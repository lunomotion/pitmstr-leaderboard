# System Overview

This page lists the major building blocks of PITMSTR and the responsibility each one owns. Everything here maps to real files in the repository.

## Runtime shape

PITMSTR is one deployable: a Next.js 16 App Router app. There is no separate backend service. Server Components render on Vercel's Node runtime, Client Components hydrate in the browser, and API route handlers run as serverless functions. State that outlives a request lives in Airtable, Clerk, or Stripe, never in app memory (the only in-process state is a best-effort lookup cache described below).

## Building blocks

### 1. Front end (pages and components)

- **Public pages** under `src/app/`: `page.tsx` (home), `leaderboard/`, `events/`, `teams/`, `schools/`, `knowledge-base/`. These are listed as public in `src/middleware.ts` and need no login.
- **Auth pages**: `sign-in/[[...sign-in]]` and `sign-up/[[...sign-up]]` render Clerk's `<SignIn />` and `<SignUp />` components.
- **Role dashboards** under `src/app/dashboard/`: `page.tsx` is a router that redirects by role; `school/` (teacher), `my/` (student and parent), `state/` (state director), and `pending/` (no role yet).
- **Admin console** under `src/app/admin/`: 21 sections wrapped by `admin/layout.tsx`, gated to `role === "admin"`. See [Admin Console](../features/admin-console.md).
- **Scan flows** under `src/app/scan/`: the judge scoring form (`turnin/.../[category]`) and the check-in confirmation (`checkin/...`). Public so judges can use them from a phone without an account.
- **Shared components** in `src/components/`: `Header`, `EventCard`, `LeaderboardRow`, `RankBadge`, `DivisionBadge`, `DivisionFilter`, `CategoryFilter`, `SearchInput`, `AlphabetFilter`, `StateFlag`. Re-exported from `src/components/index.ts`.

### 2. API layer

Every route handler lives under `src/app/api/`. Read endpoints are public (events, teams, schools, leaderboard, stats, scoring). Write and admin endpoints call `requirePermission()` first. Responses follow the `ApiResponse<T>` shape from `src/lib/types.ts`: `{ success, data?, error?, pagination? }`. See the API Reference section for per-route detail.

### 3. Authentication and RBAC

Three files own this:

- `src/middleware.ts`: a `clerkMiddleware` that matches an explicit public-route allowlist and calls `auth.protect()` on everything else.
- `src/lib/auth.ts`: `getAuthContext()` reads `userId`, `role`, `schoolId`, `stateId` from the Clerk session claims; `requireAuth()` and `requirePermission()` are the guards route handlers use.
- `src/lib/roles.ts`: defines the five roles and a `PERMISSIONS` map from action keys (for example `events:create`) to the roles allowed to perform them.

### 4. Data access layer

`src/lib/airtable.ts` is the single module that touches Airtable. It:

- Lazily constructs the Airtable client from `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`.
- Holds a `TABLES` map of human table names (`Events`, `Teams`, `Charter`, `Students`, `Turn-Ins`, `BBQ Report Cards`, `Divisions`, `Categories`, `States`, `Users`, `Audit Log`, `Invoices`, `Vendor Documents`).
- Caches the Divisions, Categories, and States lookup tables in module-level `Map`s so linked-record IDs can be resolved to names without refetching.
- Maps raw Airtable records into the typed interfaces in `src/lib/types.ts`.
- Provides user-sync helpers (`createUser`, `updateUser`, `updateUserRole`, `suspendUser`) and `logAuditEvent`.

!!! warning "Verify: lookup cache is per-instance and never invalidated"
    The lookup cache in `src/lib/airtable.ts` lives in module scope and is only populated once per serverless instance. If a division, category, or state is renamed in Airtable, warm instances keep serving the old name until they recycle. This is fine for stable lookup tables but worth knowing during data edits.

### 5. Scoring engine

`src/lib/scoring.ts` is pure, dependency-free TypeScript that implements the NHSBBQA M.E.A.T. system: drop-lowest averaging per component, weighted category scores, event totals, a deterministic tie-break index, and ranking. It does not read or write Airtable; callers feed it judge scores and read back results. See [Scoring Engine](../subsystems/scoring-engine.md).

### 6. QR and scan subsystem

`src/lib/qr.ts` builds scan URLs and renders QR codes (data URI or PNG buffer for PDF embedding). The `src/app/scan/*` pages are the targets those QR codes point to. The judge form posts to `/api/scoring/submit`, which writes a row to the `BBQ Report Cards` table.

### 7. Billing subsystem

`src/lib/stripe.ts` lazily constructs the Stripe client. `/api/billing/checkout` creates a Checkout Session for an invoice and flips it to `Pending`. `/api/webhooks/stripe` verifies the Stripe signature and, on `checkout.session.completed`, marks the invoice `Paid`. See [Billing and Stripe](../subsystems/billing-stripe.md).

### 8. PDF and report generation

`src/lib/pdf/` holds three `@react-pdf/renderer` documents: `invoice.tsx`, `event-report.tsx`, and `qr-turn-in-sheet.tsx`. The `/api/reports/*` routes render and stream them; `payment-package` uses `jszip` to bundle an invoice PDF with the vendor documents into one ZIP.

## External services

| Service | Used for | Configured by |
|---|---|---|
| Clerk | Authentication, user accounts, session, role metadata | `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| Airtable | System of record for all domain data | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` |
| Stripe | Card payments for charter invoices | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Vercel | Hosting, serverless functions, edge caching | Project settings |

See [Environment Variables](../getting-started/environment.md) for the complete table.
