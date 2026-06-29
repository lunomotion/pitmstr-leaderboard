# Deployment

PITMSTR is a standard Next.js 16 App Router application. This page documents the current Vercel deployment and gives a complete, host-agnostic path to deploy it off Vercel onto hosting the client owns.

## Build facts (from the repo)

These come from `package.json` and `next.config.ts`:

| Item | Value |
|---|---|
| Framework | Next.js `16.1.4` (App Router) |
| Runtime | React `19.2.3`, TypeScript `5.x` |
| Install command | `npm ci` (uses `package-lock.json`) |
| Build command | `npm run build` (runs `next build`) |
| Start command | `npm run start` (runs `next start`) |
| Output | `.next/` (default Next.js server output) |
| Node version | Node 20.x recommended |

!!! warning "Verify Node version"
    Next.js 16 requires a modern Node release. Use the current Node 20 LTS line for production. There is no `.nvmrc` or `engines` field in the repo pinning a version, so set Node 20.x explicitly in your host's settings and confirm the build passes before go-live.

`next.config.ts` allows remote images from two hosts: `upload.wikimedia.org` and `v5.airtableusercontent.com`. Any new image source (for example a new CDN for logos) must be added to `images.remotePatterns` or the image will not render.

## Current deployment: Vercel

Today the app is connected to a Vercel project that builds from the GitHub repo.

- Repo: `github.com/lunomotion/pitmstr-leaderboard`, branch `main`.
- Trigger: every push to `main` produces a production deployment. Pull requests get preview deployments.
- Build: Vercel auto-detects Next.js and runs `npm run build`.
- Environment variables: stored in the Vercel project settings (Production, Preview, Development scopes).
- Domain: HighSchoolBBQLeague.com is attached to the Vercel project (see [Domain & DNS](domain-dns.md)).

!!! warning "Verify Vercel ownership"
    The Vercel project currently sits under LunoMotion's account. Full ownership transfer means either transferring the project to the client's Vercel team or moving off Vercel entirely (below). See [Handoff & Ownership](../handoff-ownership.md).

### Deploy a change on Vercel

1. Merge or push your change to `main`.
2. Vercel builds automatically. Watch the build in the Vercel dashboard under the project's Deployments tab.
3. When the build is green, it is promoted to production automatically.
4. If a build fails, the previous production deployment stays live. Read the build log, fix, and push again.

### Roll back on Vercel

1. Open the project in the Vercel dashboard.
2. Go to Deployments, find the last known-good deployment.
3. Use "Promote to Production" (or "Rollback") on that deployment.

## Moving off Vercel

The app is a normal Next.js server app, so it runs anywhere that can run Node 20 and serve a long-running process. The target is client-owned hosting. Two practical options:

### Option A: A managed Node host (recommended for low ops)

Examples: Render, Railway, Fly.io, AWS Amplify, Netlify (with the Next runtime), DigitalOcean App Platform. These mirror the Vercel model (connect GitHub, set env vars, auto-build) but the account belongs to the client.

1. Create an account/team owned by the client.
2. Create a new web service and connect the GitHub repo, branch `main`.
3. Set the build settings:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Start command: `npm run start`
   - Node version: 20.x
4. Add every environment variable (see the full list below).
5. Deploy once and confirm the build is green and the site loads on the host's temporary URL.
6. Point the domain at the new host (see [Domain & DNS](domain-dns.md)).
7. Update the Clerk and Stripe dashboards with the new production URL and webhook endpoints (see below).

### Option B: A self-managed server (VPS / container)

Examples: a DigitalOcean droplet, Hetzner box, or any Docker host. More control, more ops.

1. Provision a Node 20 server (or build a container `FROM node:20`).
2. Clone the repo and install: `npm ci`.
3. Create a production `.env.local` (or inject env vars through the process manager) with every variable below.
4. Build: `npm run build`.
5. Start under a process manager so it restarts on crash and boot. Example with PM2:
   ```bash
   npm ci
   npm run build
   pm2 start "npm run start" --name pitmstr
   pm2 save
   ```
6. Put a reverse proxy (Nginx or Caddy) in front of the app on port 3000, terminate TLS there, and forward to `http://localhost:3000`.
7. Point the domain at the server's IP (see [Domain & DNS](domain-dns.md)).

!!! tip "Containerize for portability"
    A small `Dockerfile` (`FROM node:20`, copy, `npm ci`, `npm run build`, `CMD npm run start`) makes the app trivially movable between hosts and is the cleanest thing to hand the next developer. This is not in the repo today, so it would be a small one-time addition.

## Environment variables for any host

Every secret must be re-entered on the new host. These are read by the app (from `.env.local.example`, `.env.local`, and the code):

| Variable | Purpose | Public? |
|---|---|---|
| `AIRTABLE_API_KEY` | Airtable personal access token | Server only |
| `AIRTABLE_BASE_ID` | Base id, `appaCm0sgJFrCRmx2` | Server only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key | Public |
| `CLERK_SECRET_KEY` | Clerk server key | Server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route (`/sign-in`) | Public |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route (`/sign-up`) | Public |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in | Public |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up | Public |
| `STRIPE_SECRET_KEY` | Stripe server key | Server only |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures | Server only |
| `ADMIN_PASSWORD` | Password gate for `/admin/login` | Server only |
| `NEXT_PUBLIC_BASE_URL` | Base URL for OpenGraph and links | Public |
| `NEXT_PUBLIC_APP_URL` | Base URL used by QR code generation | Public |

!!! danger "Set both URL variables to the real domain at go-live"
    QR code generation reads `NEXT_PUBLIC_APP_URL` (and OpenGraph reads `NEXT_PUBLIC_BASE_URL`). If these still point at `localhost` or a Vercel preview URL in production, judges scanning QR codes at an event will be sent to the wrong place. Set both to `https://highschoolbbqleague.com`.

See [Environment Variables](../getting-started/environment.md) for where to obtain each value.

## External services to update when the URL changes

Moving hosts (or attaching the real domain) changes the app's public URL. Three services must be told:

1. **Clerk**: add the production domain as an allowed origin / production instance, and confirm the sign-in and sign-up redirect URLs. The Clerk webhook endpoint is `POST /api/webhooks/clerk`.
2. **Stripe**: the webhook endpoint is `POST /api/webhooks/stripe`. Point a Stripe webhook at `https://highschoolbbqleague.com/api/webhooks/stripe`, subscribe to `checkout.session.completed`, and copy the new signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Airtable**: no URL config needed, but confirm the personal access token has access to base `appaCm0sgJFrCRmx2`.

## Post-deploy smoke test

After any production deploy or host move, confirm:

1. The home page and [public leaderboard](../features/leaderboard.md) load.
2. Sign-in works (Clerk).
3. The [admin console](../features/admin-console.md) loads at `/admin` after `/admin/login`.
4. A test Stripe checkout completes and the webhook marks the invoice paid (use Stripe test mode first).
5. A QR turn-in link opens the scoring form on a phone.

For the full pre-launch list, see the [Go-Live Checklist](../pre-production/checklist.md).
