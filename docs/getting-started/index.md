# Getting Started

This section gets a developer who has never seen PITMSTR from a fresh clone to a running local app, and explains where everything lives. Read it top to bottom on your first day.

## What PITMSTR is

A Next.js 16 web app for the National High School BBQ Association (NHSBBQA). It runs a public competition leaderboard, role-based dashboards for teachers, students, parents, and state directors, an admin console for NHSBBQA staff, QR-based judge scoring at events, and Stripe-backed charter invoicing. It is deployed at `highschoolbbqleague.com` and hosted on Vercel.

## The five things to understand first

1. **One app, two faces.** The same Next.js codebase renders the public site and serves the JSON API under `/api/*`. There is no separate backend.
2. **Airtable is the database.** All domain data (events, teams, schools, students, scores, invoices) lives in an Airtable base. `src/lib/airtable.ts` is the only module that talks to it.
3. **Clerk is auth.** Users sign in through Clerk. Their role lives in Clerk `publicMetadata` and is mirrored into the Airtable `Users` table by a webhook and by admin actions.
4. **Roles drive everything.** Five roles (`admin`, `teacher`, `student`, `parent`, `state_director`) decide which dashboard you land on and what the API lets you do. The rules are in `src/lib/roles.ts`.
5. **Stripe handles money.** Charter invoices ($250 per team) are paid via Stripe Checkout; a webhook marks them paid.

## Where to go next

| If you want to... | Read |
|---|---|
| Run it locally right now | [Local Setup](local-setup.md) |
| Know what each env var is and where to get it | [Environment Variables](environment.md) |
| Find your way around the folders | [Project Structure](project-structure.md) |
| Understand how the system fits together | [Architecture](../architecture/index.md) |
| See the Airtable tables and fields | [Data Model](../data-model/index.md) |
| Understand auth and permissions | [Authentication and RBAC](../auth-rbac/index.md) |

## Minimum prerequisites

- Node.js (the project targets a current LTS; React 19 / Next 16 require Node 18.18+ or newer)
- npm (the repo ships `package-lock.json`, so use npm, not yarn or pnpm)
- Access to the NHSBBQA Airtable base, the Clerk project, and the Stripe account (ask the project owner for credentials)

## Fast path

```bash
git clone <repo-url>
cd pitmstr
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev                          # http://localhost:3000
```

The app will boot with just the Airtable variables set, the leaderboard and events pages render from Airtable. Auth-gated areas (`/dashboard`, `/admin`) and payments need the Clerk and Stripe variables too. Full detail is in [Local Setup](local-setup.md).
