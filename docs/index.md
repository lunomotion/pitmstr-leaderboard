# PITMSTR Platform Documentation

Welcome to the complete documentation for **PITMSTR**, the competition management platform built for the **National High School BBQ Association (NHSBBQA)** and its state divisions (TXHSBBQA and others).

This site is the single source of truth for the platform: how it is built, how to run it, how every feature works, and how to operate, extend, and own it. It is written to take a new developer or administrator from zero to confident.

!!! tip "New here? Start with these"
    - **Developers:** [Getting Started](getting-started/index.md) then [Architecture](architecture/index.md) and [New Developer Onboarding](training/new-developer.md).
    - **Administrators:** the [Admin Training](training/admin-guide.md) guide.
    - **Taking over the project:** [Handoff & Ownership](handoff-ownership.md) and the [Go-Live Checklist](pre-production/checklist.md).

## What PITMSTR Does

PITMSTR runs the full lifecycle of a high school BBQ competition season:

- **Schools and teams** register, get approved, and are organized by state and division.
- **Events** are created and teams register and pay entry fees.
- **Judging and scoring** happen on-site, including QR-based check-in and turn-in, with the MEAT scoring engine computing results.
- **Leaderboards** publish standings to the public and to each role.
- **Invoicing and payments** run through Stripe, with generated PDF invoices and payment packages.
- **Reports and certificates** are generated as PDFs for events, results, and state directors.
- **Compliance** (liability waivers, handbook agreements) is captured during registration.

## The Stack at a Glance

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Authentication | Clerk |
| Data store | Airtable |
| Payments | Stripe (+ svix for webhook verification) |
| PDF generation | @react-pdf/renderer |
| Data fetching | TanStack React Query |
| QR codes | qrcode |
| Hosting (current) | Vercel |

See [Tech Stack](architecture/tech-stack.md) for the full picture and the reasoning behind each choice.

## How This Documentation Is Organized

- **Getting Started** - run it locally, environment variables, project layout.
- **Architecture** - how the system fits together and how requests flow.
- **Data Model** - the complete Airtable schema and the data-access layer.
- **Authentication & RBAC** - Clerk, roles, and route protection.
- **Features** - an end-to-end walkthrough of every user-facing capability.
- **API Reference** - every API route documented endpoint by endpoint.
- **Subsystems** - deep dives into scoring, billing, PDF generation, and QR flows.
- **Operations** - deployment, domain, runbook, monitoring, backups.
- **Pre-Production** - the go-live checklist and the mock competition test plan.
- **Training** - role-based guides for developers, admins, teachers, judges, and state directors.
- **Roadmap** - planned future phases.
- **Handoff & Ownership** - the account inventory and ownership transfer steps.

!!! info "Keeping these docs current"
    The documentation lives in the `docs/` folder of the application repository and is published automatically to GitHub Pages on every change to `main`. To edit a page, use the pencil icon at the top right, or edit the Markdown file directly and commit. See [Operations](operations/index.md) for details.
