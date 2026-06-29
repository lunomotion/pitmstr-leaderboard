# Project Structure

How the repository is laid out, folder by folder. Paths are relative to the repo root.

## Top level

```text
pitmstr/
├── src/                  # all application code
│   ├── app/              # App Router: pages + API routes
│   ├── components/       # shared React components
│   ├── lib/              # data access, auth, scoring, PDF, QR, types
│   ├── types/            # additional type declarations
│   └── middleware.ts     # Clerk route protection
├── scripts/              # standalone tsx scripts (seeding, field checks)
├── public/               # static assets
├── docs/                 # this MkDocs documentation
├── package.json          # scripts + dependencies
├── next.config.ts        # Next config (remote image hosts)
├── tsconfig.json         # strict TS, @/* -> ./src/* alias
├── eslint.config.mjs     # flat ESLint config
├── postcss.config.mjs    # Tailwind v4 via PostCSS
├── mkdocs.yml            # docs site config
├── BRANDING.md           # brand palette and usage
└── CLAUDE.md             # project notes for AI assistants
```

The repo also contains some handoff artifacts at the root (`NHSBBQA_MEAT_Scoring_Developer_Packet.docx`, `Stage1_5_Handoff/`, `M6_Completion_Report.html`) and `.next/`, `node_modules/`, and `site/` build output you can ignore.

## `src/app` (App Router)

Folders are routes. `page.tsx` is a UI route, `route.ts` is an API endpoint, `layout.tsx` wraps a subtree, and `[param]` / `[[...param]]` are dynamic and catch-all segments.

### Public pages

| Path | Route | What it is |
|---|---|---|
| `app/page.tsx` | `/` | Home / landing |
| `app/leaderboard/page.tsx` | `/leaderboard` | Event list to pick a leaderboard |
| `app/leaderboard/[eventId]/page.tsx` | `/leaderboard/:eventId` | Standings for one event |
| `app/leaderboard/[eventId]/team/[teamId]/page.tsx` | nested | One team's results at an event |
| `app/events/page.tsx` | `/events` | Public event listings |
| `app/teams/page.tsx`, `teams/[teamId]/page.tsx` | `/teams`, `/teams/:id` | Team directory and team fan page |
| `app/teams/ember/page.tsx` | `/teams/ember` | A specific named team page |
| `app/schools/[schoolId]/page.tsx` | `/schools/:id` | School (charter) public page |
| `app/knowledge-base/page.tsx` | `/knowledge-base` | Searchable FAQ / resources |

### Auth pages

| Path | Route |
|---|---|
| `app/sign-in/[[...sign-in]]/page.tsx` | `/sign-in` (renders Clerk `<SignIn />`) |
| `app/sign-up/[[...sign-up]]/page.tsx` | `/sign-up` (renders Clerk `<SignUp />`) |

### Dashboards (signed-in)

| Path | Route | For |
|---|---|---|
| `app/dashboard/page.tsx` | `/dashboard` | Router: redirects by role |
| `app/dashboard/school/page.tsx` | `/dashboard/school` | Teacher / school admin |
| `app/dashboard/my/page.tsx` | `/dashboard/my` | Student and parent |
| `app/dashboard/state/page.tsx` | `/dashboard/state` | State director |
| `app/dashboard/pending/page.tsx` | `/dashboard/pending` | User with no role yet |

### Admin console

`app/admin/layout.tsx` is the shell (sidebar nav, gated to `role === "admin"`). Each subfolder is a section: `billing/` (and `billing/documents/`), `categories/`, `charters/`, `divisions/`, `events/` (and `events/[eventId]/documents/`), `judges/`, `lfhq-radio/`, `media/`, `penalties/`, `report-cards/`, `reports/`, `sponsors/`, `states/`, `students/`, `teams/`, `turn-ins/`, `users/`, `volunteers/`. See [Admin Console](../features/admin-console.md).

### Scan flows (public)

| Path | Route |
|---|---|
| `app/scan/checkin/[eventId]/[teamId]/page.tsx` | team check-in confirmation |
| `app/scan/turnin/[eventId]/[teamId]/[category]/page.tsx` | judge M.E.A.T. scoring form |

### API routes (`app/api`)

| Folder | Endpoints | Purpose |
|---|---|---|
| `api/events/` | `route.ts`, `[eventId]/route.ts`, `[eventId]/documents/route.ts` | Event CRUD and per-event document uploads |
| `api/teams/` | `route.ts`, `[teamId]/route.ts` | Team list/create/delete, team detail |
| `api/schools/` | `route.ts`, `[schoolId]/route.ts` | School (Charter) list and detail |
| `api/students/` | `route.ts` | Student search |
| `api/users/` | `route.ts`, `[userId]/role`, `[userId]/school`, `[userId]/team` | User listing and self/admin linking of role, school, team |
| `api/scoring/` | `submit`, `checkin`, `calculate` | Judge score submission, check-in, score calculation |
| `api/leaderboard/` | `route.ts` | Aggregated standings for an event |
| `api/stats/` | `route.ts` | Dashboard counts (events, teams, schools, students) |
| `api/billing/` | `checkout/route.ts` | Create Stripe Checkout Session for an invoice |
| `api/reports/` | `event-results`, `invoice`, `payment-package`, `qr-sheet`, `qr-sheet-batch` | PDF and ZIP generation |
| `api/admin/` | `entities`, `invoices`, `lookups`, `scorecards`, `turn-ins`, `vendor-documents` | Admin-only data endpoints |
| `api/webhooks/` | `clerk`, `stripe` | Inbound server-to-server webhooks |

!!! note "Stray backup files"
    A few files carry `.local`, `.m6bak`, or `route.ts.m6bak` suffixes (for example `dashboard/page.tsx.local`, `lib/roles.ts.m6bak`, `api/scoring/submit/route.ts.m6bak`). These are local backups, not active routes, and are not part of the build. Leave or delete them; Next.js only compiles `page.tsx` / `route.ts`.

## `src/lib` (the engine room)

| File | Responsibility |
|---|---|
| `airtable.ts` | The only Airtable client. CRUD for events, teams, schools, students, invoices, vendor docs, users; lookup caching; audit logging. |
| `auth.ts` | `getAuthContext`, `requireAuth`, `requirePermission`, `isAuthError`. Reads role from Clerk session claims. |
| `roles.ts` | `ROLES`, `ROLE_LABELS`, the `PERMISSIONS` map, `hasPermission`, `hasRole`. |
| `scoring.ts` | Pure M.E.A.T. scoring engine: components, weights, tie-break, ranking. |
| `qr.ts` | QR URL builders and QR image generation. |
| `stripe.ts` | Lazy Stripe client (`getStripe`, `isStripeConfigured`). |
| `types.ts` | Domain types (`Event`, `Team`, `School`, `Invoice`, etc.) plus constants (`DIVISIONS`, `CATEGORIES`, `US_STATES`, `CHARTER_FEE`, payer/payment enums). |
| `format.ts` | Display formatting helpers (for example `formatStateHSBBQ`). |
| `pdf/invoice.tsx` | Invoice PDF document. |
| `pdf/event-report.tsx` | Event results PDF document. |
| `pdf/qr-turn-in-sheet.tsx` | Printable QR turn-in sheet PDF. |

## `src/components`

`Header`, `EventCard`, `LeaderboardRow`, `RankBadge`, `DivisionBadge`, `DivisionFilter`, `CategoryFilter`, `SearchInput`, `AlphabetFilter`, `StateFlag`. Most are re-exported from `components/index.ts` for clean imports (`@/components`).

## `scripts`

| File | Purpose |
|---|---|
| `seed-demo-data.ts` | Seeds states, divisions, categories, schools, teams, events, scores. `--turn-ins-only` flag seeds just turn-ins. |
| `seed-invoices.ts` | Seeds demo invoices. |
| `check-fields.ts` | Inspects Airtable field names (useful when field labels drift). |
