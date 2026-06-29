# Monitoring & Backups

How to know the app is healthy, where to read errors, and how to make sure the data is recoverable.

## What to monitor

PITMSTR has four moving parts. Watch each:

| Component | Healthy signal | Where to check |
|---|---|---|
| The app (Next.js) | Pages and `/api/*` return 200 | Host logs, uptime check |
| Airtable | Reads/writes succeed | App logs, Airtable status page |
| Clerk | Sign-in works | Clerk dashboard logs |
| Stripe | Checkouts complete, webhooks deliver | Stripe dashboard, webhook event log |

## Logs today

There is no third-party error monitoring wired into the app yet. Logging is whatever the host provides plus the dashboards of each service.

- **Vercel (current host)**: project, Deployments for build logs; Runtime Logs / Functions for live request and error output.
- **Self-managed host**: `pm2 logs pitmstr` and the reverse proxy logs.
- **Stripe**: Developers, Webhooks, open the endpoint to see every delivery, the response code, and the payload. Failed deliveries are visible and replayable here.
- **Clerk**: dashboard logs for auth events and failures.
- **Airtable**: no per-request log, but the base's revision history shows recent record changes.

!!! tip "Set up a basic uptime check now (free)"
    Even without error monitoring, add an external uptime monitor (UptimeRobot, Better Stack, or similar) that pings `https://highschoolbbqleague.com` every few minutes and emails on failure. This is the cheapest way to learn the site is down before a user reports it.

## Error monitoring: Sentry (future)

Structured error monitoring is on the [roadmap](../roadmap.md) as part of the Phase 1 hardening (Cloudflare + Sentry, budgeted around $1,500, targeted around September). It is **not installed today**.

When adopted, Sentry would:

- Capture unhandled exceptions in both server and client code with stack traces.
- Group errors and alert on new or spiking issues.
- Tie an error to the deploy that introduced it.

!!! warning "Verify before claiming coverage"
    Until Sentry (or an equivalent) is installed and configured with a DSN, assume there is no automatic error capture. During a live event, a developer should watch the host runtime logs and the Stripe webhook log in real time.

## Airtable backup strategy

Airtable is the system of record, so its data is the most important thing to protect. Airtable has no automatic point-in-time backup on lower plans, so back it up deliberately.

### Existing mirror

Per the project notes, a Google Sheets mirror of the Airtable data exists as a backup.

!!! warning "Verify the Google Sheets mirror"
    Confirm the Google Sheets backup is still syncing, who owns it, and how fresh it is. If it depends on an automation (for example an n8n or Make scenario) that is paused or unowned, it is not a reliable backup. Document its owner and cadence, or replace it.

### Recommended backup routine

1. **Manual snapshot before every event and before any schema change.** In Airtable, use "Duplicate base" to create a dated copy (for example `PITMSTR backup 2026-09-01`). This captures structure and data in one click.
2. **Periodic CSV/export** of the critical tables (Events, Teams, Charter, Students, Turn-Ins, Invoices) stored somewhere the client owns (Google Drive).
3. **Keep the base id documented**: production is `appaCm0sgJFrCRmx2`. A restore means creating records back into this base or repointing `AIRTABLE_BASE_ID` at a restored copy.

### Restore

1. If a bad bulk edit happened recently, use Airtable's base revision history / snapshots to roll back individual changes.
2. For a full loss, restore from the most recent "Duplicate base" copy, then set `AIRTABLE_BASE_ID` to the restored base and redeploy.

## Clerk and Stripe are their own backups

- **Clerk** holds the user list and roles. It is durable and managed; you do not back it up, but you should document that role data lives in each user's `publicMetadata`.
- **Stripe** holds the payment record of truth. Invoices marked paid in Airtable are confirmed by Stripe's own dashboard. If Airtable and Stripe disagree, Stripe is authoritative for money.

## Pre-event monitoring checklist

Before a real competition day:

1. Uptime monitor is active and alerting to a real inbox.
2. A fresh Airtable base snapshot was taken today.
3. The Stripe webhook endpoint shows recent successful deliveries (run a test).
4. A developer is on call and has access to the host logs.

See the full [Go-Live Checklist](../pre-production/checklist.md).
