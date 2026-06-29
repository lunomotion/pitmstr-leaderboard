# Admin Training

For the NHSBBQA administrator (Mike's team). This is the day-to-day guide to running events, managing people and roles, handling billing, and pulling reports. Each section links to the feature page with the full detail.

## What an admin can do

The NHSBBQA Admin role (Super User) has full access. You work mostly from the admin console at `/admin`.

| Area | Where | Full detail |
|---|---|---|
| Events | `/admin/events` | [Events & Teams](../features/events-teams.md) |
| Teams, schools, students | `/admin/teams`, `/admin/students`, `/admin/charters` | [Registration](../features/registration.md) |
| Users and roles | `/admin/users` | [Roles & Permissions](../auth-rbac/roles.md) |
| Scoring / turn-ins | `/admin/turn-ins`, `/admin/report-cards` | [Scoring & Judging](../features/scoring-judging.md) |
| Billing and invoices | `/admin/billing` | [Invoicing & Payments](../features/billing.md) |
| Vendor documents | `/admin/billing/documents` | [Invoicing & Payments](../features/billing.md) |
| Reports and certificates | `/admin/reports` | [Reports & Certificates](../features/reports.md) |
| Divisions, categories, states | `/admin/divisions`, `/admin/categories`, `/admin/states` | [Events & Teams](../features/events-teams.md) |

## Logging in

1. Go to `/admin`. You will be sent to `/admin/login`.
2. Sign in with your account (Clerk) and enter the admin password.
3. You land on the admin dashboard.

!!! note "Two layers of access"
    The admin area requires both a signed-in account with the admin role and the shared admin password. If you cannot get in, confirm your Clerk role and that you have the current `ADMIN_PASSWORD`. A developer can fix either; see the [Runbook](../operations/runbook.md#add-an-administrator).

## Run an event

1. In `/admin/events`, create the event: name, dates, division, categories, and location.
2. Confirm the division uses an official name (KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ).
3. As teams register (or as you add them), confirm they appear under the event.
4. Before the event, generate QR sheets for check-in and turn-ins from the reports tools (`/api/reports/qr-sheet-batch` produces a multi-page PDF for all teams).
5. On the day, judges scan QR codes to score; you monitor turn-ins coming in under `/admin/turn-ins`.
6. After scoring, review the [leaderboard](../features/leaderboard.md), then generate results and certificates from `/admin/reports`.

For the full event lifecycle, see [Events & Teams](../features/events-teams.md).

## Manage users and roles

1. Open `/admin/users`.
2. To change someone's role, set it there. Roles are: NHSBBQA Admin, State Director, Teacher, Student/Parent. The app updates the user's Clerk `publicMetadata`.
3. The user must sign out and back in for a new role to take effect.

To add another admin, see the [Runbook: Add an administrator](../operations/runbook.md#add-an-administrator). Role definitions are in [Roles & Permissions](../auth-rbac/roles.md).

## Billing and payments

The billing dashboard at `/admin/billing` shows invoices, analytics, search, and a monthly chart. See [Invoicing & Payments](../features/billing.md) for the complete flow.

### Create and send an invoice

1. In `/admin/billing`, create an invoice for a school/team. The charter fee is $250 per team.
2. Choose the payer type (Teacher, Office Admin, CTE Director, Parent, Sponsor, In-Kind Donor) and payment method (Check, Credit Card, Purchase Order).
3. The invoice PDF generates automatically.
4. Share the public pay link `/pay/[invoiceId]` with the payer. They pay by card through Stripe.
5. When Stripe confirms payment, the webhook marks the invoice paid automatically. You will see the status flip in the dashboard.

### Payment package (invoice + vendor documents)

Schools and districts often need your vendor paperwork to process payment.

1. Upload the six vendor documents once in `/admin/billing/documents`: W-9, ACH, Insurance, Sole Source, Procurement, District Adoption.
2. Once all are uploaded and marked active, every invoice gains a Payment Package download that ZIPs the invoice with all vendor docs.

!!! warning "Vendor documents must be uploaded for the package to work"
    The Payment Package endpoint needs the vendor documents present and active in Airtable. If a school says the package is incomplete, check `/admin/billing/documents`.

## Reports and certificates

From `/admin/reports` you can generate:

- Event and category results PDFs.
- BBQ report cards for teams.
- Batch QR sheets for an event.

See [Reports & Certificates](../features/reports.md). Certificate automation for state directors (multiple certificate types per state) is a future phase, see the [Roadmap](../roadmap.md).

## Create and delete a test event

To rehearse safely, create a clearly named test event (for example `TEST - Mock Run`), run a few turn-ins through it, then delete it and its teams afterward so production stays clean. The full rehearsal is the [Mock Competition Test Plan](../pre-production/mock-test.md).

## Compliance you are responsible for

- **FERPA**: student data must stay protected. Do not expose student personal data publicly or share it outside authorized roles.
- **Waivers**: liability waiver and handbook agreement at registration are planned but not yet built. See [Compliance & Waivers](../features/compliance.md) and the [Roadmap](../roadmap.md).

## When something breaks

- A payment did not mark paid: check the Stripe webhook log; see [Runbook](../operations/runbook.md) and [Monitoring](../operations/monitoring.md).
- A user cannot access what they should: check their role in `/admin/users`.
- The site is down: that is a developer task; see [Runbook: Recover from "the site is down"](../operations/runbook.md#recover-from-the-site-is-down).
