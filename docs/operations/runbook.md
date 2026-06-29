# Runbook & Common Tasks

Step-by-step procedures for the operational tasks that come up most often. Each one is written to be followed top to bottom without prior context.

!!! warning "Verify host-specific steps"
    Steps that mention "the host dashboard" assume the current Vercel project. If the app has moved off Vercel, the same actions exist on the new host under slightly different menu names. The principle is identical: change the environment variable, then redeploy.

## Rotate an API key or secret

Do this whenever a key is leaked, a person with access leaves, or on a routine schedule.

The secrets the app uses: `AIRTABLE_API_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_PASSWORD`.

1. **Generate the new value at the source.**
    - Airtable: create a new personal access token at `https://airtable.com/create/tokens` with access to base `appaCm0sgJFrCRmx2`. Scopes needed: data read/write for the base.
    - Clerk: in the Clerk dashboard, API Keys, roll the secret key.
    - Stripe: in the Stripe dashboard, Developers, API keys, roll the secret key. For the webhook secret, open the webhook endpoint and reveal its signing secret.
    - `ADMIN_PASSWORD`: pick a new strong value yourself.
2. **Update the environment variable on the host.** Replace the old value in the host's project settings (Production scope).
3. **Redeploy** so the running app picks up the new value (see "Re-run a build" below). Environment changes do not take effect until a redeploy.
4. **Smoke test** the affected area: Airtable key, load the leaderboard; Clerk key, sign in; Stripe key, run a test checkout.
5. **Revoke the old value at the source** once the new one is confirmed working. Do not revoke before step 4 passes.

!!! danger "Rotate webhook and API keys together for Stripe"
    If you roll the Stripe secret key but not the webhook secret (or vice versa), one half of billing breaks silently. After rotating, run a Stripe test-mode checkout and confirm the invoice flips to paid.

## Add an administrator

There are two distinct "admin" concepts. Know which you need.

### A. App admin role (NHSBBQA Admin in Clerk)

This gives a real person the admin role across the app, enforced by Clerk `publicMetadata`.

1. Have the person sign up at `/sign-up` so they exist as a Clerk user.
2. Open the Clerk dashboard, Users, find them.
3. Edit their `publicMetadata` and set the admin role. Match the exact shape the app expects (see [Roles & Permissions](../auth-rbac/roles.md) for the precise key and value).
4. Have them sign out and back in so the new metadata is in their session.
5. Confirm they can reach `/admin`.

### B. Admin console password (`/admin/login`)

The admin area is also gated by a shared password from `ADMIN_PASSWORD`. To change who can get in, rotate that password (see "Rotate an API key or secret") and share the new value only with authorized admins.

!!! warning "Verify the admin gate"
    The admin area is protected by both Clerk auth (middleware) and the `ADMIN_PASSWORD` gate at `/admin/login`. Confirm the current behavior in [Middleware & Route Protection](../auth-rbac/middleware.md) before changing access, so you do not lock out a legitimate admin.

## Change a user's role

1. Open the [Admin Console](../features/admin-console.md), Users section, if the role can be set there. The app exposes a role endpoint at `PATCH /api/users/[userId]/role`.
2. If you must do it directly, edit the user's `publicMetadata` in the Clerk dashboard to the target role value from [Roles & Permissions](../auth-rbac/roles.md).
3. The user must re-authenticate (sign out and in) for the change to take effect in their session.

## Re-run a build / redeploy

### On Vercel

1. Open the Vercel project, Deployments.
2. Either push an empty commit to `main`, or use "Redeploy" on the latest deployment.
3. Watch the build log to green.

### On any host

```bash
git pull origin main
npm ci
npm run build
# restart the process, e.g.
pm2 restart pitmstr
```

A redeploy is required after any environment-variable change.

## Roll back a bad deploy

1. **Vercel**: Deployments, find the last good one, Promote to Production.
2. **Self-managed**: check out the last good commit and rebuild:
   ```bash
   git checkout <last-good-sha>
   npm ci && npm run build
   pm2 restart pitmstr
   ```
3. After rollback, fix forward on `main` and redeploy normally.

## Check logs

### Application / build logs

- **Vercel**: project, Deployments, open a deployment for build logs; Functions / Runtime Logs for live request logs and errors.
- **Self-managed**: `pm2 logs pitmstr`, plus the reverse proxy access/error logs (Nginx or Caddy).

### What to look for

- 500 errors on `/api/*` routes usually mean a bad env var (Airtable or Clerk or Stripe key) or an Airtable schema mismatch.
- Stripe webhook failures show in the Stripe dashboard under the webhook endpoint's event log, including the response the app returned.
- Clerk auth issues show in the Clerk dashboard logs.

See [Monitoring & Backups](monitoring.md) for a fuller picture.

## Seed or reset demo data

The repo ships seed scripts (run locally against the configured Airtable base):

```bash
npm run seed              # seed demo events, teams, schools, etc.
npm run seed:turnins      # seed turn-in / scoring rows only
npx tsx scripts/seed-invoices.ts   # seed demo invoices
```

!!! danger "Seeds write to whatever base AIRTABLE_BASE_ID points at"
    These scripts write real rows into the Airtable base in your local `.env.local`. Never run them with production credentials unless you intend to add demo rows to production. For a real launch, seed a staging base or clean the demo rows out afterward through the admin console.

## Create and delete a test contest (admin)

For the mock run and for any rehearsal, the [Admin Console](../features/admin-console.md) can create a full sample event and remove it afterward:

1. In `/admin`, Events, create a new event with a clear name like `TEST - Mock Run`.
2. Add a couple of teams and run a turn-in through the QR flow.
3. After the rehearsal, delete the test event and its teams from the admin console so production data stays clean.

The two-day rehearsal script is in [Mock Competition Test Plan](../pre-production/mock-test.md).

## Recover from "the site is down"

1. Is it the app or DNS? `curl -I https://highschoolbbqleague.com`. A DNS resolution error points to [Domain & DNS](domain-dns.md); an HTTP 500 points to the app.
2. Check the host's deployment status. Did the last deploy fail? Roll back (above).
3. Check the three dependencies: Airtable, Clerk, Stripe status pages. An outage in any of them degrades the app.
4. Check env vars are still set (a common cause after a host migration is a missing variable).
5. If a recent code change caused it, roll back to the last good deploy, then fix forward.
