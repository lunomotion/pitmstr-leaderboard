# Tech Stack

Every framework, library, and service the project depends on, drawn from `package.json`, with what it does and why it is here. Versions are the ranges declared in `package.json` at the time of writing.

## Runtime dependencies

| Package | Version | Role | Why it is used |
|---|---|---|---|
| `next` | 16.1.4 | Framework | App Router app that serves pages, Server Components, and API route handlers from one codebase. Deploys to Vercel as serverless functions. |
| `react` / `react-dom` | 19.2.3 | UI runtime | The component model for all pages and the admin console. React 19 paired with Next 16. |
| `@clerk/nextjs` | ^6.37.3 | Authentication | Sign-in / sign-up UI, session management, middleware (`clerkMiddleware`), server helpers (`auth`, `currentUser`, `clerkClient`), and role storage in `publicMetadata`. |
| `airtable` | ^0.12.2 | Data access | Official Airtable JS client. The whole system of record is an Airtable base; `src/lib/airtable.ts` wraps every call. |
| `stripe` | ^22.0.1 | Payments | Server-side Stripe SDK. Creates Checkout Sessions for charter invoices and verifies webhook signatures. Pinned to API version `2026-03-25.dahlia` in `src/lib/stripe.ts`. |
| `svix` | ^1.84.1 | Webhook verification | Verifies Clerk webhook signatures in `/api/webhooks/clerk`. Clerk delivers webhooks via Svix. |
| `@react-pdf/renderer` | ^4.3.2 | PDF generation | Renders invoices, event result reports, and QR turn-in sheets as PDFs (`src/lib/pdf/*.tsx`). |
| `qrcode` | ^1.5.4 | QR codes | Generates check-in and turn-in QR codes as data URIs or PNG buffers (`src/lib/qr.ts`) for the scan flows and printable sheets. |
| `jszip` | ^3.10.1 | Zip bundling | Builds the "payment package" ZIP (invoice PDF plus vendor documents) in `/api/reports/payment-package`. |
| `@tanstack/react-query` | ^5.90.19 | Data fetching | Client-side server-state library. Declared as a dependency for caching and async data on the client. !!! note inline below. |
| `lucide-react` | ^0.562.0 | Icons | Icon set used across every page and the admin console. |

!!! warning "Verify: React Query usage"
    `@tanstack/react-query` is listed in `package.json`, but most client pages in `src/app` fetch with the native `fetch` + `useEffect` pattern rather than `useQuery`. Confirm where (if anywhere) a `QueryClientProvider` and React Query hooks are actually wired before relying on it. It may be partially adopted or reserved for future use.

## Dev and build tooling

| Package | Version | Role |
|---|---|---|
| `typescript` | ^5 | Language. Strict mode is on (`tsconfig.json`), path alias `@/* -> ./src/*`. |
| `tailwindcss` + `@tailwindcss/postcss` | ^4 | Styling. Tailwind CSS v4 via the PostCSS plugin (`postcss.config.mjs`). Brand tokens live in `src/app/globals.css`. |
| `eslint` + `eslint-config-next` | ^9 / 16.1.4 | Linting. Config in `eslint.config.mjs`. Run with `npm run lint`. |
| `tsx` | ^4.19.0 | Runs the TypeScript seed scripts (`npm run seed`, `npm run seed:turnins`). |
| `dotenv` | ^16.4.7 | Loads `.env.local` inside the standalone seed scripts. |
| `@types/*` | various | Type definitions for Node, React, React DOM, and `qrcode`. |

## Frameworks and patterns in use

- **Next.js App Router** (not the Pages Router). Routes are folders with `page.tsx` (UI) or `route.ts` (API). Dynamic segments use `[param]` and catch-alls use `[[...param]]`.
- **Server Components by default.** Client interactivity is opt-in with `"use client"` at the top of a file (for example the dashboards and scan forms). Server Components handle auth-aware redirects (for example `dashboard/page.tsx`).
- **Middleware-based auth.** A single `src/middleware.ts` protects everything not on the public allowlist.
- **Lazy service clients.** Airtable and Stripe clients are constructed on first use, not at module load, so a missing env var does not crash the build.

## Fonts and branding

`src/app/layout.tsx` loads three Google fonts via `next/font`: Open Sans (body, `--font-open-sans`), Oswald (headings, `--font-oswald`), and Permanent Marker (accent, `--font-permanent-marker`). Brand colors (BBQ red, Americana blue, gold, smoke black) are defined as CSS variables. See `BRANDING.md` in the repo root for the full palette and usage rules.

## What is deliberately not here

- **No ORM or SQL database.** Airtable is the database.
- **No state-management library** beyond React Query and React's own hooks (no Redux, Zustand, etc.).
- **No separate API server.** API routes are part of the Next.js app.
- **No test framework** is declared in `package.json` at the time of writing.

!!! warning "Verify: automated tests"
    There is no test runner (Jest, Vitest, Playwright) in `package.json`. If you add changes to the scoring engine in `src/lib/scoring.ts`, write and wire up tests first, since it is pure and highly testable but currently uncovered.
