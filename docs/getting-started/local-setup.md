# Local Setup

Exact steps to run PITMSTR on your machine.

## 1. Prerequisites

- **Node.js**: a current LTS (Next 16 / React 19 require Node 18.18 or newer; Node 20+ recommended).
- **npm**: the repo ships `package-lock.json`, so use npm. Do not switch to yarn or pnpm.
- **Accounts and credentials** (from the project owner):
    - Airtable personal access token and the base ID
    - Clerk publishable and secret keys (and, for webhooks, a signing secret)
    - Stripe secret key and webhook signing secret (only needed to test billing)

## 2. Clone and install

```bash
git clone <repo-url>
cd pitmstr
npm install
```

`npm install` runs against the committed `package-lock.json`, so everyone gets the same dependency tree.

## 3. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

The checked-in `.env.local.example` only contains the Airtable keys and a base URL. The app reads more than that. The full set the running app and scripts expect:

```bash
# Airtable (required, app will not load data without these)
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
AIRTABLE_BASE_ID=appaCm0sgJFrCRmx2

# Clerk (required for sign-in, dashboards, admin)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_xxx          # only for /api/webhooks/clerk

# Stripe (required only to test billing)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Base URL (used for QR links and OpenGraph)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

See [Environment Variables](environment.md) for what each one is and where to get it.

!!! warning "Verify: ADMIN_PASSWORD"
    The live `.env.local` also contains an `ADMIN_PASSWORD` key, but no application code reads `process.env.ADMIN_PASSWORD`. Admin access is gated by the Clerk `admin` role, not a password. Treat `ADMIN_PASSWORD` as legacy or unused unless you find a reference to it.

## 4. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`. The public leaderboard and events pages should render data from Airtable. To reach `/dashboard` or `/admin` you must be signed in through Clerk, and for `/admin` your Clerk user needs `publicMetadata.role = "admin"` (set it in the Clerk dashboard for your test user).

## 5. Build and run a production bundle

```bash
npm run build   # compiles and type-checks the whole app
npm run start   # serves the production build locally
```

`npm run build` is the same command Vercel runs on deploy, so it is the quickest way to catch type errors before pushing.

## 6. Lint

```bash
npm run lint
```

Uses the flat ESLint config in `eslint.config.mjs` with `eslint-config-next`.

## 7. Seed demo data (optional)

Two scripts populate the Airtable base with realistic demo content. They read `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` from `.env.local` via `dotenv` and run with `tsx`.

```bash
npm run seed            # seeds states, divisions, categories, schools, teams, events, and scores
npm run seed:turnins    # seeds only turn-in scores (passes --turn-ins-only)
```

What `npm run seed` creates (from `scripts/seed-demo-data.ts`): 8 states, 2 divisions (HSBBQ, MSBBQ), 6 food categories, 12 schools, 25 teams, 5 events (a mix of upcoming, live, completed), and sample turn-in scores for completed events. Demo schools are prefixed `DEMO -` so they are easy to spot and remove.

There is also `scripts/seed-invoices.ts` (referenced in the project `CLAUDE.md` as `npx tsx scripts/seed-invoices.ts`) for demo invoices, and `scripts/check-fields.ts` for inspecting Airtable field names.

!!! warning "Seed scripts write to the real base"
    The seed scripts write directly to whatever base `AIRTABLE_BASE_ID` points at. Point them at a development or sandbox base, not production, unless you intend to add demo records to the live data.

## Common first-run issues

| Symptom | Cause | Fix |
|---|---|---|
| "AIRTABLE_API_KEY is not configured" thrown on a data page | Missing Airtable env vars | Fill them into `.env.local` and restart `npm run dev` |
| Redirected to sign-in on `/dashboard` | Not signed in (expected) | Sign in via Clerk |
| `/admin` redirects to `/dashboard` | Clerk user has no `admin` role | Set `publicMetadata.role = "admin"` in the Clerk dashboard |
| Stripe checkout errors | `STRIPE_SECRET_KEY` unset | Add Stripe keys; billing is optional for non-billing work |
