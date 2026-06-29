# Tables & Relationships

This page explains what each table is **for** and how it links to the others. For the field-by-field breakdown see [Airtable Schema](airtable-schema.md). For the functions that read and write these tables see [Data Access Layer](data-access.md).

## Relationships overview

```text
                         States
                           ^  ^
              State link   |  |   State link
                           |  |
            Charter (Schools)   Events
                ^   |             |  ^   ^
       Charter |   | Teams        |  |   | Category (multi)
        link   |   v link         |  |   |
                  Teams <---------+  |   +----- Categories
                ^   |   ^    Teams   |              ^   ^
       Team     |   |   |  (multi)   |  Division    |   |
       link     |   |   |            |  link        |   |
                |   v   |            v              |   |
           Students  Division --> Divisions         |   |
                                                    |   |
   Turn-Ins  ---- Team / Event / Category links ----+   |
       |                                                |
       | Report Cards link                              |
       v                                                |
   BBQ Report Cards -- Judge / Team / Event / Category --+
                            |
                            v
                          Judges

   Users   --link-->  Charter, States, Teams      (role assignment)
   Audit Log --link--> Users                       (who did what)
   Invoices  --link--> Charter                      (who is billed)
   Vendor Documents                                 (standalone)
```

The base is a hub-and-spoke design. The **lookup tables** (`States`, `Divisions`, `Categories`) sit at the edges and are referenced by everything. The **transactional tables** (`Turn-Ins`, `BBQ Report Cards`, `Invoices`, `Audit Log`) link back into the core entities (`Events`, `Teams`, `Charter`).

---

## Lookup tables

These three tables are small, stable, and read-heavy. The data layer loads each one fully into an in-memory cache on first use (see [Data Access Layer](data-access.md#lookup-caches)).

### States

The list of state BBQ associations. Holds a full `State Name` and an `Abbreviation`. Linked **to** by `Events.State`, `Charter.State`, and `Users.State`. Note that `Teams` stores its state as plain text, not a link.

The display brand format (`TX` becomes `TXHSBBQA`, or `Texas High School BBQ Association (TXHSBBQA)`) is derived in `src/lib/format.ts`, not stored.

### Divisions

The competition divisions (KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ). Holds `Division Name`, `Code`, `Grade Range`, `Age Range`. Linked **to** by `Events.Division` and `Teams.Division`. The canonical, richer division metadata also lives in the `DIVISIONS` constant in `src/lib/types.ts`.

### Categories

The food categories that get scored (Brisket, Pork, Chicken, etc.). Holds `Category Name` (and an inferred `Category Description`). Linked **to** by `Events.Category` (multiple), `Turn-Ins.Category`, and `BBQ Report Cards.Category`.

---

## Core entity tables

### Charter (Schools)

The **school** is the `Charter` table. A charter is the billable unit: it fields teams and receives invoices. It links **down** to its `Teams` and **out** to its `State`. It is referenced **by** `Invoices.Charter` and `Users.School`.

One charter has many teams. A team belongs to exactly one charter (`getTeam()` reads a single `Charter` link and resolves its `Charter Name`).

### Teams

A competing team. Links **up** to its `Charter`, **out** to its `Division`, and stores its `State` as plain text. It is referenced **by** `Events.Teams` (a team can be registered for many events), `Students.Team`, `Turn-Ins.Team`, `BBQ Report Cards.Team`, and `Users.Team`.

`getTeamCountsByCharter()` exists specifically to count teams per charter in a single scan, which the billing dashboard uses to size invoices without an N+1 lookup.

### Students (Team Members)

Individual members of a team. Each student links to a `Team`. This is the only table flagged as FERPA-sensitive in the project rules: be careful surfacing any student PII. `getTeamMembers()` fetches a team's roster with a `FIND(...)` formula against the linked `Team` field.

### Events

A competition. An event links **out** to one `State`, one `Division`, many `Categories`, and many `Teams`. The `Teams` link is the authoritative roster for that event: the leaderboard reads team membership from `Event.Teams`, not by scanning all teams.

Event status (`upcoming` / `live` / `completed` / `cancelled`) is mostly **computed from `Event Date`** at read time, with an optional `Status Override` field taking precedence. Event files live in the `Documents` attachment field on this table.

---

## Scoring tables

The scoring path has two related tables, and the relationship between them is the single most important thing to understand in this base.

### Turn-Ins

Represents a **physical box submission**: a team handing in food in a category at an event. In the production admin model it links to `Team`, `Event`, `Category`, carries a `Box Photo` and `Turn-In Time`, and links **forward** to the `BBQ Report Cards` (`Report Cards` link) generated for it, with a `Scorecard Count` rollup.

!!! warning "Turn-Ins carries MEAT scores in the seeded/PDF path"
    The demo seeder and the Event Results PDF route (`/api/reports/event-results`) read and write `MEAT_M/E/A/T` directly on `Turn-Ins`. The live scoring form does **not**: it writes to `BBQ Report Cards`. Depending on data origin, MEAT scores may live on `Turn-Ins`, on `BBQ Report Cards`, or both. See the [schema-level warning](airtable-schema.md#turn-ins).

### BBQ Report Cards

Represents **one judge's MEAT scorecard** for a team in a category at an event. This is what the live scoring form (`/api/scoring/submit`, reached from the QR judge form at `/scan/turnin/...`) writes. It links to `Judge`, `Team`, `Event`, and `Category`, and carries the four MEAT component scores plus a Airtable-computed `Total Score` and `Total Penalty Points`.

How the leaderboard ties it together (`getEventLeaderboard()` in `src/lib/airtable.ts`):

1. Read `Event.Teams` to get the set of teams in the event.
2. Fetch all `BBQ Report Cards`, keep those whose `Event` link includes this event.
3. Group scorecards by `Team` and by `Category`, averaging `Total Score`.
4. Resolve each team's name and school (`getTeam()` then `Charter`), sort by score, assign ranks.

### Judges

The pool of judges. A `BBQ Report Cards.Judge` link points here. Used only when submitting a score, to resolve a judge by name or record ID. If no match is found, the scorecard is saved without a judge link.

---

## Identity and operations tables

### Users

The Airtable mirror of Clerk authentication. Each row maps a `Clerk ID` to app-level role and assignment data. The lifecycle:

| Trigger | Effect |
| --- | --- |
| Clerk sign-up | `createUser()` inserts a row with `Status = "pending"`. |
| Clerk `user.updated` | `updateUser()` syncs email/name/last login. |
| Admin assigns role | `updateUserRole()` sets `Role`, flips `Status` to `active`, optionally links `School` / `State` / `Team`. |
| Clerk delete | `suspendUser()` sets `Status = "suspended"` (the row is kept, not deleted). |

`Users` links **out** to `Charter` (School), `States`, and `Teams` for scoped roles (Teacher, State Director). Clerk remains the auth source of truth; Airtable holds the role and association mapping the app needs.

### Audit Log

An append-only record of admin actions, written by `logAuditEvent()`. Each entry links **to** the acting `User` and records the action, target type/ID, a JSON `Details` blob, and an IP. Writes are best-effort: a failed audit write never breaks the underlying operation.

### Invoices

Billing lives in its own table, deliberately not bolted onto `Charter`. Each invoice links to one `Charter` and pulls its `Charter Name` as a lookup. It captures the payer, the AEU (Authorized Educational Unit) type, payment method, status, amount, and tax-exempt details. The charter fee is $250 per team (`CHARTER_FEE`). Stripe checkout and the webhook update `Payment Status` and `Paid At`.

### Vendor Documents

A standalone table of the six payment-support documents schools' finance departments ask for (W-9, ACH, Insurance, Sole Source, Procurement, District Adoption). It does not link to any other table. Once populated, every invoice can offer a "Payment Package" download that ZIPs the invoice with these docs.
