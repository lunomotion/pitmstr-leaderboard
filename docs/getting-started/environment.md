# Environment Variables

Every environment variable PITMSTR reads, what it is, and where to get it. Variables are loaded from `.env.local` in development (gitignored) and from Vercel project settings in production.

## How to read this table

- **Read in code** means a `process.env.<NAME>` reference exists in the codebase. These were confirmed by grepping `src` and `scripts`.
- **`NEXT_PUBLIC_` prefix** means the value is exposed to the browser. Never put a secret behind a `NEXT_PUBLIC_` name.

## Variables

| Variable | Required | Read in code | What it is | Where to get it |
|---|---|---|---|---|
| `AIRTABLE_API_KEY` | Yes | `src/lib/airtable.ts`, `src/app/api/teams/route.ts`, `src/app/api/events/route.ts`, `src/app/api/scoring/submit/route.ts`, seed scripts | Airtable personal access token (starts `pat_`). Grants read/write to the base. | Airtable: create at `airtable.com/create/tokens` with `data.records:read`/`write` scopes on the base. |
| `AIRTABLE_BASE_ID` | Yes | same as above | The base ID (starts `app`), for example `appaCm0sgJFrCRmx2`. Selects which Airtable base is the system of record. | From the base URL: `airtable.com/appXXXXXXXXXXXXXX/...`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (for auth) | Clerk SDK (read implicitly by `@clerk/nextjs`) | Clerk publishable key (browser-safe). Initializes the Clerk client. | Clerk dashboard: API Keys. |
| `CLERK_SECRET_KEY` | Yes (for auth) | Clerk SDK (server) | Clerk secret key. Used by server helpers (`auth`, `clerkClient`) and middleware. | Clerk dashboard: API Keys. Secret, server only. |
| `CLERK_WEBHOOK_SECRET` | For Clerk webhook | `src/app/api/webhooks/clerk/route.ts` | Svix signing secret used to verify Clerk webhook payloads (`user.created/updated/deleted`). | Clerk dashboard: Webhooks, when you create the endpoint pointing at `/api/webhooks/clerk`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Recommended | Clerk SDK | Path to the sign-in page (`/sign-in`). | Set yourself; must match the route at `src/app/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Recommended | Clerk SDK | Path to the sign-up page (`/sign-up`). | Set yourself; must match `src/app/sign-up`. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Recommended | Clerk SDK | Where Clerk sends users after sign-in (`/dashboard`). | Set yourself. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Recommended | Clerk SDK | Where Clerk sends users after sign-up (`/dashboard`). | Set yourself. |
| `STRIPE_SECRET_KEY` | For billing | `src/lib/stripe.ts` | Stripe secret key. Creates Checkout Sessions and verifies webhooks. `isStripeConfigured()` checks its presence. | Stripe dashboard: Developers, API keys. Secret. |
| `STRIPE_WEBHOOK_SECRET` | For billing | `src/app/api/webhooks/stripe/route.ts` | Signing secret for the Stripe webhook endpoint. Verifies `checkout.session.completed` events. | Stripe dashboard: Developers, Webhooks, when you add the `/api/webhooks/stripe` endpoint. |
| `NEXT_PUBLIC_APP_URL` | Recommended | `src/lib/qr.ts`, `src/app/api/billing/checkout/route.ts` | Base URL the app builds absolute links from (QR scan URLs, Stripe success/cancel URLs). Checked before `NEXT_PUBLIC_BASE_URL`. | Set yourself: `http://localhost:3000` locally, `https://highschoolbbqleague.com` in production. |
| `NEXT_PUBLIC_BASE_URL` | Recommended | `src/lib/qr.ts`, `src/app/api/billing/checkout/route.ts`, OpenGraph | Fallback base URL used when `NEXT_PUBLIC_APP_URL` is unset. | Set yourself, same value as `NEXT_PUBLIC_APP_URL`. |

## Precedence notes

- **QR and checkout base URL** resolve in this order: `NEXT_PUBLIC_APP_URL`, then `NEXT_PUBLIC_BASE_URL`, then a hard-coded fallback. In `src/lib/qr.ts` the fallback is `https://pitmstr.vercel.app`; in the Stripe checkout route the fallback is `https://highschoolbbqleague.com`. Set both `NEXT_PUBLIC_*` URLs explicitly to avoid surprises in generated links.

!!! warning "Verify: keep both base-URL variables in sync"
    Because QR links and Stripe redirect URLs read these, a wrong value silently produces broken scan links or redirects to the wrong domain after payment. In production both should be `https://highschoolbbqleague.com`.

## Listed in `.env.local` but not read by app code

| Variable | Status |
|---|---|
| `ADMIN_PASSWORD` | Present in the live `.env.local` but no `process.env.ADMIN_PASSWORD` reference exists in `src` or `scripts`. Admin access is enforced by the Clerk `admin` role, not a password. Treat as legacy/unused. |

!!! note "Source of truth"
    The committed `.env.local.example` only lists the Airtable keys and `NEXT_PUBLIC_BASE_URL`. The complete working set above is reconstructed from the keys in the live `.env.local` plus every `process.env.*` reference in the code. When you add a new variable, update both `.env.local.example` and this page.
