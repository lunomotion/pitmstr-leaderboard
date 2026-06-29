# Features

This section walks through every user-facing capability in PITMSTR and which role uses it. Each feature has its own page with the underlying routes and data.

## Roles at a glance

There are five roles, defined in `src/lib/roles.ts`. A signed-in user with no role assigned yet sees a pending screen.

| Role key | Label | Lands on | Can do |
|---|---|---|---|
| `admin` | NHSBBQA Admin | `/admin` | Everything: events, teams, schools, users, invoices, reports, role assignment |
| `teacher` | Teacher / School Admin | `/dashboard/school` | Manage their school's teams, link themselves to a school |
| `student` | Student | `/dashboard/my` | View their team and results, link themselves to a team |
| `parent` | Parent | `/dashboard/my` | Same view as student, scoped to their student's team |
| `state_director` | State Director | `/dashboard/state` | State-level oversight (dashboard is a stub today) |
| (none) | Public / pending | `/dashboard/pending` or public pages | View leaderboard, events, teams, schools, knowledge base |

## Feature map

| Feature | Page | Primary roles | Public? |
|---|---|---|---|
| Registration and school activation | [Registration](registration.md) | Teacher, Admin | Sign-up public; activation admin |
| Events and teams | [Events and Teams](events-teams.md) | Admin (create), Teacher (view), Public | View public, write admin |
| Scoring and judging | [Scoring and Judging](scoring-judging.md) | Judges (no account), Admin | Scan forms public |
| Leaderboard | [Leaderboard](leaderboard.md) | Everyone | Yes |
| Invoicing and payments | [Invoicing and Payments](billing.md) | Admin, Payers | Pay pages public |
| Reports and certificates | [Reports and Certificates](reports.md) | Admin | No |
| Compliance and waivers | [Compliance and Waivers](compliance.md) | (see page) | n/a |
| Admin console | [Admin Console](admin-console.md) | Admin | No |

## The lifecycle of a competition

A useful mental model for how the features connect during a season:

1. **A school registers.** A teacher signs up (Clerk), an admin grants the `teacher` role, and the teacher links to their school charter. See [Registration](registration.md).
2. **The school is invoiced.** An admin creates a charter invoice ($250 per team); the payer pays via Stripe. See [Invoicing and Payments](billing.md).
3. **An admin creates an event** and registers teams into it. See [Events and Teams](events-teams.md).
4. **QR sheets are printed.** The reports tool generates per-team turn-in QR sheets. See [Reports and Certificates](reports.md).
5. **At the event, teams check in** by scanning their check-in QR, and judges score each turn-in box by scanning its category QR. See [Scoring and Judging](scoring-judging.md).
6. **Standings appear live** on the public leaderboard as scores land in Airtable. See [Leaderboard](leaderboard.md).
7. **Results reports are generated** as PDFs after the event. See [Reports and Certificates](reports.md).

Throughout, the admin console is the staff cockpit for all of the above. See [Admin Console](admin-console.md).
