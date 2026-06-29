# Operations

This section covers everything needed to run PITMSTR in production: how it is deployed, how the domain and DNS are wired, the day-to-day runbook, and how to monitor and back up the system.

## What "production" means for PITMSTR

PITMSTR is a Next.js 16 App Router application (React 19, TypeScript). It is currently hosted on **Vercel** and served at **HighSchoolBBQLeague.com**. A goal of the handoff is to move hosting off LunoMotion's Vercel account and onto infrastructure the client (NHSBBQA) owns, so nothing stays locked to the original developer.

The application itself is stateless. All durable data lives in external services:

| Concern | Where it lives | Notes |
|---|---|---|
| Application code | GitHub `lunomotion/pitmstr-leaderboard` (`main`) | Source of truth for the app |
| Hosting / build | Vercel (today) | Builds from `main`, serves the site |
| Database | Airtable base `appaCm0sgJFrCRmx2` | System of record for all data |
| Authentication | Clerk | Users, sessions, roles in `publicMetadata` |
| Payments | Stripe | Checkout sessions, webhooks |
| Domain | Registrar for HighSchoolBBQLeague.com | DNS points at the host |

Because the app is stateless, redeploying or moving hosts does not lose data. The data lives in Airtable, Clerk, and Stripe regardless of where the Next.js app runs.

## The four operations topics

1. [Deployment](deployment.md): how the current Vercel build works, and a complete path to deploy off Vercel onto client-owned hosting.
2. [Domain & DNS](domain-dns.md): how to point HighSchoolBBQLeague.com at the host and manage DNS records.
3. [Runbook & Common Tasks](runbook.md): step-by-step procedures for rotating keys, adding an admin, re-running a build, checking logs, and recovering from common problems.
4. [Monitoring & Backups](monitoring.md): error monitoring options, where to read logs, and how to back up Airtable.

## Operating principles

!!! tip "Keep the system of record clean"
    Airtable is the single source of truth. Avoid editing data directly in Airtable during a live event unless you understand the schema. Prefer the [Admin Console](../features/admin-console.md), which writes through the API and respects relationships.

!!! warning "Secrets live only in the host's environment"
    No API keys are committed to the repo. `.env.local` is gitignored. Every secret (Airtable, Clerk, Stripe, admin password) is set as an environment variable in the hosting platform. When you move hosts, you must re-enter all of them. See [Environment Variables](../getting-started/environment.md) for the full list.

## Who does what

| Task | Typical owner |
|---|---|
| Deploy a code change | Developer (push to `main`) |
| Rotate a leaked key | Developer or technical admin |
| Run an event, manage users | NHSBBQA admin (Mike) |
| Manage a state's pages | State director |
| DNS / domain changes | Whoever owns the registrar login |

For ownership transfer of every account above, see [Handoff & Ownership](../handoff-ownership.md).
