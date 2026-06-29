# Admin Console

The admin console at `/admin` is the NHSBBQA staff cockpit. It manages every part of the platform: users, events, teams, schools, students, scoring data, billing, and reports. All sections live under `src/app/admin/`.

## Access control

There is no separate admin login page. The console is gated by the Clerk **admin** role:

- `src/app/admin/layout.tsx` reads the current Clerk user with `useUser()` and checks `user.publicMetadata.role`.
- Only `role === "admin"` is allowed in. Any other (or missing) role is redirected to `/dashboard`.
- Sign-in happens through Clerk's normal flow (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`); sign-out uses Clerk's `SignOutButton` and returns to `/`.
- API protection is enforced independently: admin endpoints under `/api/admin/*` and admin write routes call `requirePermission("admin:access")` (or a more specific permission) from `src/lib/auth.ts`, so a non-admin cannot reach the data even by calling the API directly.

!!! note "Two layers of protection"
    The layout gates the UI; the API guards gate the data. Both check the Clerk role. Do not rely on the layout alone, every admin data route re-checks permission server-side.

## Navigation

The sidebar in `admin/layout.tsx` groups sections into a main list, a Competition Data group, and a Lookup Tables group, plus a "View Live Site" link and Sign Out.

| Group | Sections |
|---|---|
| Main | Dashboard, User Management, Events, Teams, Schools, Students, Judges, Volunteers, Sponsors, Billing and Invoices, Reports and PDFs, LFHQ Radio |
| Competition Data | Turn-Ins, Scorecards, Penalties, Media |
| Lookup Tables | States, Divisions, Categories |

## Sections

### Dashboard (`/admin`)

Executive overview. Four stat cards (Events, Teams, Schools, Students) from `GET /api/stats`, quick-action links to the main management screens, and placeholder Recent Activity / Upcoming Events panels. A banner notes that changes sync to Airtable.

### User Management (`/admin/users`)

Manages Clerk accounts and their roles. Lists users from `GET /api/users` with search and a role filter (including "Pending Approval"). Per user: a role dropdown (admin, teacher, student, parent, state director, or unassigned) and a school assignment dropdown. Role changes call `PATCH /api/users/[userId]/role`; school assignment also goes through that metadata update. This is the activation screen described in [Registration](registration.md).

### Events (`/admin/events`)

Full event CRUD. Create via a modal (`POST /api/events`), delete with confirmation (`DELETE /api/events?id=`), search and filter by status. Each row links to the event's documents page and its public leaderboard. Division options come from `GET /api/admin/lookups?table=divisions`.

### Event Documents (`/admin/events/[eventId]/documents`)

Per-event file management (flyer, W-9, invoice, logistics, rules, other). Upload, list, download, and delete via `/api/events/[eventId]/documents`. Accepts PDF, DOC(X), XLS(X), PNG, JPG up to 10 MB.

### Teams (`/admin/teams`)

Team CRUD. Add via modal (`POST /api/teams`) with name, state, division, and coach; delete with confirmation (`DELETE /api/teams?id=`). Search and division filter; per-division badge colors. See [Events and Teams](events-teams.md).

### Schools / Charters (`/admin/charters`)

Registered school charters by state. Search and state filter; table of name, city, state, and team count; link to each school's public page. Reads `GET /api/schools`.

!!! note "Charters vs. Schools label"
    The route is `/admin/charters` and the underlying Airtable table is **Charter**, but the UI and rest of the app call these "Schools." They are the same entity.

### Students (`/admin/students`)

Student roster linked to teams and schools. Search by name, email, team, or school. Reads `GET /api/students`. Subject to the FERPA posture in [Compliance](compliance.md).

### Judges (`/admin/judges`)

Read-only judge records. Renders a dynamic table from the Airtable schema via `GET /api/admin/entities?table=Judges`. Judges have no app accounts; they are referenced by name when scores are submitted.

### Volunteers (`/admin/volunteers`)

Read-only volunteer records via `GET /api/admin/entities?table=Volunteers`. Dynamic schema-driven table.

### Sponsors (`/admin/sponsors`)

Read-only sponsor records via `GET /api/admin/entities?table=Sponsors`. Dynamic schema-driven table.

### Billing and Invoices (`/admin/billing`)

The financial dashboard. Time-period toggle (month, year, all time); stat cards for Total Invoiced, Collected, Outstanding, and Collection Rate; a 12-month revenue chart; search and status filter; and an invoice table. Per-row actions: download invoice PDF, download the payment-package ZIP, copy the public pay link, open the Stripe payment page, and change status. "Create New Invoice" opens a modal (charter, billing contact, payer type, AEU type, payment method, team count, tax-exempt, notes). Talks to `GET/POST/PATCH /api/admin/invoices`, plus `/api/schools` and `/api/teams`. See [Invoicing and Payments](billing.md).

### Vendor Documents (`/admin/billing/documents`)

The six shared payment-package documents (W-9, ACH, Insurance, Sole Source, Procurement, District Adoption). Shows upload status ("X of 6 uploaded") and view/download links. Documents are uploaded in Airtable; this screen surfaces them via `GET /api/admin/vendor-documents`. See [Compliance](compliance.md).

### Reports and PDFs (`/admin/reports`)

On-demand PDF generation. Three report types: Event Results Report, QR Turn-In Sheet (single team), and Bulk QR Sheets (all teams in one multi-page PDF). Pick an event (and team for single QR), set options (teams per page, top N), then Preview or Generate and Download. Calls `/api/reports/event-results`, `/api/reports/qr-sheet`, and `/api/reports/qr-sheet-batch`. See [Reports and Certificates](reports.md).

### LFHQ Radio (`/admin/lfhq-radio`)

A link-out to an external radio dashboard (`voyager.neptunenow.com`) with a connection-status card. No internal API.

### Turn-Ins (`/admin/turn-ins`)

Box turn-in submissions: team, event, category, turn-in time, photo indicator, scorecard count, and notes. Reads `GET /api/admin/turn-ins`. Search by team, event, or category.

### Scorecards / Report Cards (`/admin/report-cards`)

Individual judge M.E.A.T. submissions. Table of team, event, category, judge, and the four components (M /10, E /55, A /15, T /20) plus Total /100, with a M.E.A.T. reference. Reads `GET /api/admin/scorecards`. This is the raw data the leaderboard aggregates.

### Penalties (`/admin/penalties`)

Placeholder. "Log Penalty" button and empty state; no backing API yet.

### Media (`/admin/media`)

Placeholder. "Upload Media" button and empty state; no backing API yet.

### States (`/admin/states`)

Read-only state associations (abbreviation, name, record ID) via `GET /api/admin/lookups?table=states`.

### Divisions (`/admin/divisions`)

Read-only official divisions (name, code, grade range, age range, record ID) via `GET /api/admin/lookups?table=divisions`.

### Categories (`/admin/categories`)

Read-only food categories via `GET /api/admin/lookups?table=categories`.

## Section reference table

| Section | Route | Backing API | Writes? |
|---|---|---|---|
| Dashboard | `/admin` | `/api/stats` | No |
| User Management | `/admin/users` | `/api/users`, `/api/users/[id]/role`, `/api/schools` | Yes (roles) |
| Events | `/admin/events` | `/api/events`, `/api/admin/lookups` | Yes |
| Event Documents | `/admin/events/[id]/documents` | `/api/events/[id]/documents` | Yes |
| Teams | `/admin/teams` | `/api/teams`, `/api/admin/lookups` | Yes |
| Schools (Charters) | `/admin/charters` | `/api/schools` | No |
| Students | `/admin/students` | `/api/students` | No |
| Judges | `/admin/judges` | `/api/admin/entities?table=Judges` | No |
| Volunteers | `/admin/volunteers` | `/api/admin/entities?table=Volunteers` | No |
| Sponsors | `/admin/sponsors` | `/api/admin/entities?table=Sponsors` | No |
| Billing | `/admin/billing` | `/api/admin/invoices`, `/api/schools`, `/api/teams` | Yes |
| Vendor Documents | `/admin/billing/documents` | `/api/admin/vendor-documents` | No (upload in Airtable) |
| Reports | `/admin/reports` | `/api/reports/*` | No (generates PDFs) |
| LFHQ Radio | `/admin/lfhq-radio` | external link | No |
| Turn-Ins | `/admin/turn-ins` | `/api/admin/turn-ins` | No |
| Scorecards | `/admin/report-cards` | `/api/admin/scorecards` | No |
| Penalties | `/admin/penalties` | none (placeholder) | No |
| Media | `/admin/media` | none (placeholder) | No |
| States | `/admin/states` | `/api/admin/lookups?table=states` | No |
| Divisions | `/admin/divisions` | `/api/admin/lookups?table=divisions` | No |
| Categories | `/admin/categories` | `/api/admin/lookups?table=categories` | No |

!!! warning "Verify: placeholder sections"
    **Penalties** and **Media** are UI shells with non-functional buttons and no backing API. If penalty logging or media management is needed for go-live, they require building, not just enabling.
