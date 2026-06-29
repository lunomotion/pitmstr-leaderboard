# New Developer Onboarding

A guided path to take a developer from zero to making a safe, deployed change in PITMSTR. Budget about a day. Follow the read order, then do the first-change exercise.

## What you are inheriting

PITMSTR is a Next.js 16 App Router app (React 19, TypeScript) for the National High School BBQ Association. It uses:

- **Clerk** for authentication and roles (roles live in each user's `publicMetadata`).
- **Airtable** (base `appaCm0sgJFrCRmx2`) as the system of record. All data lives there.
- **Stripe** for invoice payments.
- **TanStack Query** for client data fetching, **Tailwind CSS 4** for styling, **Lucide** for icons.

The app is stateless: data lives in Airtable, Clerk, and Stripe, so deploys and host moves never lose data.

## Read order (do this first)

Read these docs in sequence before touching code:

1. [Architecture: System Overview](../architecture/system-overview.md) and [Tech Stack](../architecture/tech-stack.md): the shape of the system.
2. [Architecture: Request & Data Flow](../architecture/request-flow.md): how a request moves from browser to Airtable and back.
3. [Data Model](../data-model/index.md) and [Airtable Schema](../data-model/airtable-schema.md): the tables and relationships.
4. [Auth & RBAC](../auth-rbac/index.md), especially [Middleware & Route Protection](../auth-rbac/middleware.md): what is public vs protected.
5. [Subsystems](../subsystems/index.md): scoring, billing, PDF, and QR flows, the four areas with real logic.
6. [Operations: Deployment](../operations/deployment.md): how it ships.

## Key files and folders

| Path | What it is |
|---|---|
| `src/app/` | App Router: pages and API routes |
| `src/middleware.ts` | Clerk middleware; defines which routes are public |
| `src/lib/airtable.ts` | All Airtable CRUD lives here; the data access layer |
| `src/lib/scoring.ts` | The MEAT scoring engine |
| `src/lib/pdf/` | PDF report generation (`@react-pdf/renderer`) |
| `src/app/api/` | API routes (events, teams, schools, scoring, billing, reports, admin, webhooks) |
| `src/app/admin/` | The admin console pages |
| `src/app/scan/` | QR check-in and turn-in scoring forms (public, no login) |
| `scripts/` | Seed and utility scripts (`seed-demo-data.ts`, `seed-invoices.ts`, `check-fields.ts`) |
| `next.config.ts` | Next config, including allowed remote image hosts |
| `.env.local.example` | The template for required environment variables |

### Architecture rules to respect

- **No direct Airtable calls from client components.** Data goes through `src/app/api/*` routes, which call `src/lib/airtable.ts`. Keep it that way.
- **Public vs protected is defined in `src/middleware.ts`.** Scan and scoring routes are intentionally public so judges can score without logging in. Do not lock them down without understanding the QR flow.
- **Roles live in Clerk `publicMetadata`,** not in Airtable. See [Roles & Permissions](../auth-rbac/roles.md).
- **Official division names** are required: KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ. Never reintroduce legacy strings like "OPEN KQ".

## Run it locally

1. Clone and install:
   ```bash
   git clone https://github.com/lunomotion/pitmstr-leaderboard.git
   cd pitmstr-leaderboard
   npm ci
   ```
2. Create `.env.local` from the template and fill in every value (see [Environment Variables](../getting-started/environment.md)):
   ```bash
   cp .env.local.example .env.local
   ```
   You need Airtable, Clerk, and (for billing) Stripe keys, plus `ADMIN_PASSWORD` and the two base-URL vars set to `http://localhost:3000`.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

!!! danger "Local dev writes to a real Airtable base"
    `AIRTABLE_BASE_ID` in your `.env.local` points at a real base. The seed scripts (`npm run seed`, `npm run seed:turnins`, `npx tsx scripts/seed-invoices.ts`) write rows there. Use a staging base for development if one exists, and never run seeds against production unless you mean to.

See [Local Setup](../getting-started/local-setup.md) for the full walkthrough.

## Make your first safe change

A low-risk exercise to learn the deploy loop end to end:

1. Create a branch:
   ```bash
   git checkout -b chore/first-change
   ```
2. Make a small, visible, non-logic change (for example a copy tweak on the public home or leaderboard page under `src/app/`).
3. Run locally and confirm it looks right: `npm run dev`.
4. Lint and build before pushing:
   ```bash
   npm run lint
   npm run build
   ```
5. Push the branch and open a pull request against `main`. The host (Vercel today) builds a preview deployment; check it.
6. Once reviewed, merge to `main`. The production deploy runs automatically.
7. Verify the change on production and run the [post-deploy smoke test](../operations/deployment.md#post-deploy-smoke-test).

!!! tip "Always build before you push"
    `npm run build` catches type and route errors that `npm run dev` may not. A green local build is the cheapest way to avoid a red production deploy.

## When you need to do operational things

- Rotate a key, add an admin, roll back a deploy: [Runbook & Common Tasks](../operations/runbook.md).
- Deploy off Vercel: [Deployment](../operations/deployment.md).
- Read logs / monitor: [Monitoring & Backups](../operations/monitoring.md).
- Take over the accounts: [Handoff & Ownership](../handoff-ownership.md).
- Future work and scope: [Roadmap](../roadmap.md).
