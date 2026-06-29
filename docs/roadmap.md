# Roadmap & Future Phases

Work planned beyond the current scope, for the next developer and for the client's budgeting. Nothing on this page is built yet. Each item lists its scope, dependencies, and a rough effort or budget where known.

!!! warning "These are forward-looking estimates"
    Phase numbering, timing, and budgets reflect the plan at handoff. Confirm current priorities and budget with the client (Mike / NHSBBQA) before starting any of these. Treat the dollar and time figures as planning estimates, not quotes.

## At a glance

| Phase | Item | Rough effort / budget | Depends on |
|---|---|---|---|
| Pre-launch | Move off Vercel + ownership transfer | Part of handoff | Client-owned accounts |
| Phase 1 (~Sept) | Cloudflare + Sentry hardening | ~$1,500 | Domain and host owned by client |
| Phase 3 | Certificate automation for state directors | Medium build | Templates, per-state assets, storage |
| Phase 4 (6-7 months out) | Airtable to a proper database | Large, budget dependent | Funding, data model freeze |
| Cross-cutting | Liability waiver + handbook checkboxes at registration | Small build | Legal copy from NHSBBQA |

## Pre-launch: move off Vercel and transfer ownership

Not a future phase so much as the finish line of the handoff: get the app onto client-owned hosting and transfer every account so nothing is locked to LunoMotion.

- **Scope**: deploy the app on a client-owned host, repoint the domain, transfer GitHub, Clerk, Airtable, Stripe, and the registrar.
- **Dependencies**: client-owned accounts must exist first.
- **Effort**: bounded; this is the active handoff work.
- **Detail**: [Deployment](operations/deployment.md) and [Handoff & Ownership](handoff-ownership.md).

## Phase 1: Cloudflare + Sentry hardening (~September)

Production hardening once the platform is owned and live.

- **Scope**:
    - Put **Cloudflare** in front of the app for DNS, TLS, caching, and DDoS protection. Cloudflare becomes the DNS host and proxy.
    - Add **Sentry** (or equivalent) for structured error monitoring: captured exceptions, alerts, and release tracking across server and client.
- **Why**: today there is no automatic error capture (see [Monitoring & Backups](operations/monitoring.md)), and the app is directly exposed. This closes both gaps.
- **Dependencies**: domain and host owned by the client; a Sentry account and DSN; nameserver change to Cloudflare.
- **Rough budget**: ~$1,500.
- **Effort**: a focused engagement, mostly configuration plus a small amount of instrumentation code for Sentry.

## Phase 3: Certificate automation for state directors

Let state directors generate official certificates at scale.

- **Scope**: 4 to 5 certificate types where only the **state name and logo** change between states. Generate certificates from templates, store roughly **250 PDFs per state-director page**, and make them downloadable from that page.
- **How it builds on what exists**: PITMSTR already generates PDFs with `@react-pdf/renderer` (invoices, report cards, results). Certificates extend the same subsystem. See [PDF & Report Generation](subsystems/pdf-reports.md) and [Reports & Certificates](features/reports.md).
- **Dependencies**:
    - Final certificate designs and the 4 to 5 types from NHSBBQA.
    - Per-state assets (state name, logo).
    - A storage decision for the generated PDFs (where ~250 per state live and how they are served).
- **Effort**: medium. The PDF generation pattern exists; the new work is templating per state, batch generation, storage, and the download UI on the state-director page.

!!! warning "Verify storage approach"
    Storing hundreds of PDFs per state needs a storage target (Airtable attachments, object storage, or generate-on-demand). Decide this before building, since it affects cost and the data model.

## Phase 4: Airtable to a proper database (6 to 7 months out)

Migrate the system of record off Airtable onto a real database.

- **Scope**: replace Airtable (base `appaCm0sgJFrCRmx2`) with a relational database (for example Postgres), porting the schema and rewriting the data access layer in `src/lib/airtable.ts`.
- **Why**: Airtable is excellent for a fast start and human-friendly editing, but has rate limits, weaker referential integrity, and scaling ceilings as data and traffic grow.
- **Dependencies**:
    - Budget. This is explicitly budget dependent.
    - A frozen, well-understood data model (see [Data Model](data-model/index.md)).
    - A migration plan that preserves all live data and a parallel-run/cutover strategy.
- **Effort**: large. This touches the entire data layer. Because all data access already funnels through `src/lib/airtable.ts` and the `src/app/api/*` routes (no direct client calls), the blast radius is contained to that layer, which makes the migration more tractable than it would otherwise be.
- **Timing**: roughly 6 to 7 months out, budget permitting.

## Cross-cutting: liability waiver + handbook agreement at registration

Add required-agreement checkboxes to the registration flow.

- **Scope**: a liability waiver checkbox and a handbook-agreement checkbox a teacher (or guardian) must accept during registration, with the acceptance recorded.
- **Why**: compliance and risk management for a youth competition. This is currently a known gap; see [Compliance & Waivers](features/compliance.md) and the [Pre-Production](pre-production/index.md) notes.
- **Dependencies**: final legal copy from NHSBBQA for both documents; a decision on whether acceptance blocks registration.
- **Effort**: small. Add the fields to the registration form, persist the acceptance (and timestamp/version) in the data model, and gate completion on them.

!!! note "Decide if this is a launch blocker"
    If a real competition needs signed waivers, build this before go-live rather than treating it as a later phase. Flag it on the [Go-Live Checklist](pre-production/checklist.md).
