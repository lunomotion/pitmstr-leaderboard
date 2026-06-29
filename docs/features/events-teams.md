# Events & Teams

How competition events are created and how teams are created, registered, and managed. Events and teams are both Airtable records; admins own writes, everyone can read.

## Events

### What an event is

An event is a row in the Airtable **Events** table, mapped to the `Event` type in `src/lib/types.ts`. Key fields: name, date, location (the city is parsed as the part before the first comma), a linked **Division**, a linked **State**, linked **Category** records, an optional **Event Photo**, a **Team Count**, and the linked **Teams** registered for it.

### Status is computed, not stored (usually)

`getEvents()` / `getEvent()` in `src/lib/airtable.ts` derive status from the event date unless an explicit override exists:

- If the Airtable field **Status Override** is set to `live`, `upcoming`, `completed`, or `cancelled`, that wins.
- Otherwise: a future date is `upcoming`, today's date is `live`, a past date is `completed`.

This is why a leaderboard automatically shows an event as "LIVE" on its date without anyone toggling a flag.

### Creating an event (admin)

From the admin **Events** screen (`/admin/events`), "Create Event" posts to `POST /api/events` (`src/app/api/events/route.ts`). The handler requires the `events:create` permission (admin only), validates that name and date are present, builds the Airtable fields (linking Division, State, and Categories by record ID), creates the row, and writes an `event.created` audit log entry.

Fields accepted: `name`, `date`, `location` (or `city` + `state`), `division`, `description`, `categories`.

### Deleting an event (admin)

`DELETE /api/events?id=<eventId>` requires `events:delete`, destroys the Airtable record, and logs `event.deleted`. The admin Events table exposes this behind a confirmation modal.

### Listing and filtering events (public)

`GET /api/events` is public and supports `status`, `division`, `state`, and `limit` query params. It is cached at the edge (`s-maxage=60, stale-while-revalidate=300`). The public `/events` and `/leaderboard` pages fetch it and filter client-side by search text, division, status, state, and first letter.

### Per-event documents

Each event can carry uploaded documents (flyers, W-9s, invoices, logistics, rules). The admin route `/admin/events/[eventId]/documents` uploads and lists them via `/api/events/[eventId]/documents`. Accepted types include PDF, DOC(X), XLS(X), PNG, JPG.

## Teams

### What a team is

A team is a row in the Airtable **Teams** table, mapped to the `Team` type. Key fields: **Team Name**, a linked **Charter** (the school), a linked **Division**, **Advisor / Coach**, and **State**. The school name is resolved by following the Charter link.

### Creating a team (admin)

From the admin **Teams** screen (`/admin/teams`), "Add Team" posts to `POST /api/teams` (`src/app/api/teams/route.ts`), which requires the `admin:access` permission. Fields: `name` (required), `schoolId` (linked as Charter), `divisionId`, `coach`, `state`. The division badge colors in the admin UI are per-division (KIDSQ amber, MSBBQ brown, HSBBQ blue, HSBBQ Unified purple, CBBQ emerald, OBBQ slate).

### Deleting a team (admin)

`DELETE /api/teams?id=<teamId>` requires `admin:access` and destroys the record (behind a confirmation modal in the UI).

### Listing and searching teams (public)

`GET /api/teams` is public. With no `q` it returns all teams (capped at 200); with a query it does a simple case-insensitive match on team name and state. The public `/teams` directory and the student team-picker both use it.

!!! note "Team registration into an event"
    A team is linked to an event through the event's **Teams** field in Airtable. The admin event tools and Airtable manage that linkage; `getEventLeaderboard()` reads the event's linked `Teams` to know who is competing. There is no public self-registration endpoint that adds a team to an event.

## Divisions and categories

Both are Airtable lookup tables surfaced read-only in the admin console:

- **Divisions** (`/admin/divisions`): the official NHSBBQA divisions. The canonical six active divisions are KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, and OBBQ, defined with codes, grade ranges, and age ranges in `DIVISIONS` in `src/lib/types.ts`. Naming follows `[ACRONYM] Division`.
- **Categories** (`/admin/categories`): the food categories scored at events (Brisket, Pork, Chicken, Ribs, etc.). Events link the subset of categories they run.

## Who does what

| Action | Role | Route | Permission |
|---|---|---|---|
| View events | Anyone | `GET /api/events` | public |
| Create event | Admin | `POST /api/events` | `events:create` |
| Delete event | Admin | `DELETE /api/events` | `events:delete` |
| Upload event docs | Admin | `/api/events/[eventId]/documents` | admin |
| View teams | Anyone | `GET /api/teams` | public |
| Create team | Admin | `POST /api/teams` | `admin:access` |
| Delete team | Admin | `DELETE /api/teams` | `admin:access` |

!!! warning "Verify: teacher team creation"
    `src/lib/roles.ts` grants `teams:create` and `teams:edit` to both `admin` and `teacher`. However, the implemented `POST /api/teams` route checks `admin:access` (admin only). So although the permission model allows teachers to create teams, the live endpoint does not. Reconcile these before promising teachers self-service team creation.
