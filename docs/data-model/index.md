# Data Model

PITMSTR has no traditional database. **Airtable is the system of record.** Every event, team, school, student, score, invoice, and user lives in a single Airtable base, and the Next.js app reads and writes it through the official [`airtable`](https://www.npmjs.com/package/airtable) npm client. There is no Postgres, no Prisma, no ORM. To understand the data, open the Airtable base.

!!! info "Where the base lives"
    | Setting | Value |
    | --- | --- |
    | Base ID | `appaCm0sgJFrCRmx2` |
    | Env var | `AIRTABLE_BASE_ID` |
    | API key env var | `AIRTABLE_API_KEY` (a personal access token, `pat_...`) |

    The base ID is committed as the default in `.env.local.example`, so the documented base above is the real production base. The API key is never committed.

## How the app talks to Airtable

Most Airtable access is funnelled through one module, `src/lib/airtable.ts`, which builds the client lazily:

```typescript
let _base: Airtable.Base | null = null;

function getBase(): Airtable.Base {
  if (_base) return _base;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  // ...throws a clear error if either is missing...
  _base = new Airtable({ apiKey }).base(baseId);
  return _base;
}
```

The lazy pattern matters: the client is only constructed on the first real call, so a missing key does not break the production build, only the request that needs it.

!!! warning "Not every route uses `src/lib/airtable.ts`"
    Several API routes (`src/app/api/admin/turn-ins`, `src/app/api/admin/scorecards`, `src/app/api/admin/lookups`, `src/app/api/scoring/submit`, `src/app/api/events/[eventId]/documents`, `src/app/api/reports/event-results`) construct their **own** local `getBase()` and call Airtable directly instead of importing the shared helpers. When you rename a table or field, grep the whole `src/` tree, not just `src/lib/airtable.ts`. See [Data Access Layer](data-access.md) for the full list.

## Table naming

Table names are kept in one constant near the top of `src/lib/airtable.ts`:

```typescript
const TABLES = {
  EVENTS: "Events",
  TEAMS: "Teams",
  CHARTER: "Charter",        // Schools
  STUDENTS: "Students",      // Team Members
  TURN_INS: "Turn-Ins",
  REPORT_CARDS: "BBQ Report Cards",
  DIVISIONS: "Divisions",
  CATEGORIES: "Categories",
  STATES: "States",
  USERS: "Users",
  AUDIT_LOG: "Audit Log",
  INVOICES: "Invoices",
  VENDOR_DOCUMENTS: "Vendor Documents",
};
```

Two domain terms do not match the table name, which trips up newcomers:

- A **school** is the `Charter` table. The UI says "school", Airtable says "Charter".
- A **team member / student** is the `Students` table.

## Tables at a glance

| Table | Airtable name | What it holds | Detail |
| --- | --- | --- | --- |
| Events | `Events` | Competitions: name, date, location, linked teams and categories | [Schema](airtable-schema.md#events) / [Tables](tables.md#events) |
| Teams | `Teams` | Competing teams, linked to a Charter and Division | [Schema](airtable-schema.md#teams) / [Tables](tables.md#teams) |
| Charter (Schools) | `Charter` | Schools / charters that field teams and get billed | [Schema](airtable-schema.md#charter-schools) / [Tables](tables.md#charter-schools) |
| Students | `Students` | Individual team members | [Schema](airtable-schema.md#students-team-members) / [Tables](tables.md#students-team-members) |
| Turn-Ins | `Turn-Ins` | Physical box submissions at an event | [Schema](airtable-schema.md#turn-ins) / [Tables](tables.md#turn-ins) |
| BBQ Report Cards | `BBQ Report Cards` | Individual judge MEAT scorecards | [Schema](airtable-schema.md#bbq-report-cards) / [Tables](tables.md#bbq-report-cards) |
| Divisions | `Divisions` | Competition divisions (HSBBQ, MSBBQ, etc.) | [Schema](airtable-schema.md#divisions) / [Tables](tables.md#divisions) |
| Categories | `Categories` | Food categories scored (Brisket, Pork, etc.) | [Schema](airtable-schema.md#categories) / [Tables](tables.md#categories) |
| States | `States` | US state associations (name + abbreviation) | [Schema](airtable-schema.md#states) / [Tables](tables.md#states) |
| Users | `Users` | App users, mirrored from Clerk | [Schema](airtable-schema.md#users) / [Tables](tables.md#users) |
| Audit Log | `Audit Log` | Admin action audit trail | [Schema](airtable-schema.md#audit-log) / [Tables](tables.md#audit-log) |
| Invoices | `Invoices` | Charter-fee invoices for billing | [Schema](airtable-schema.md#invoices) / [Tables](tables.md#invoices) |
| Vendor Documents | `Vendor Documents` | W-9, ACH, Insurance and other payment docs | [Schema](airtable-schema.md#vendor-documents) / [Tables](tables.md#vendor-documents) |
| Judges | `Judges` | Judges who submit scorecards | [Schema](airtable-schema.md#judges) / [Tables](tables.md#judges) |

!!! note "Two more table names appear in code"
    `Judges` is referenced only inside `src/app/api/scoring/submit/route.ts` and is not part of the `TABLES` constant. A `Scorecards` table name is probed by the throwaway diagnostic script `scripts/check-fields.ts` but is never used by the running app. See the [Verify notes in the schema page](airtable-schema.md#judges).

## Backup mirror

Airtable is the source of truth and **Google Sheets is maintained as a mirrored backup**. The app never reads or writes the Sheets mirror; treat it as a manual disaster-recovery copy, not a live integration.

## Seeding a base

Two scripts populate a fresh base with demo data. Both load `.env.local` and require `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`.

```bash
# Core data: states, divisions, categories, schools, teams, events, sample turn-ins
npx tsx scripts/seed-demo-data.ts

# Re-seed only the turn-in scores against existing DEMO records
npx tsx scripts/seed-demo-data.ts --turn-ins-only

# Demo invoices for the billing dashboard (clears existing invoices first)
npx tsx scripts/seed-invoices.ts
```

Every record the seeder creates is prefixed with `DEMO -` so it is easy to spot and delete. The schema each script assumes is direct evidence of the real field names, and it is reflected throughout the [Airtable Schema](airtable-schema.md) page.
