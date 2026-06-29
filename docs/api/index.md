# API Reference

Every API route: method, auth, inputs, outputs, and the Airtable operations behind it.

The PITMSTR API is a set of Next.js App Router route handlers under `src/app/api`. Routes are thin: they parse the request, run an auth/permission guard, call a function in `src/lib/airtable.ts` (the single Airtable data layer), and return JSON. There is no separate API framework, no GraphQL, and no direct Airtable calls from the browser.

## Auth model

Authentication is handled by Clerk. Authorization is a role-based permission map in `src/lib/roles.ts`. Roles live in Clerk `publicMetadata` and are mirrored into the Airtable `Users` table.

### Roles

| Role key | Label |
|---|---|
| `admin` | NHSBBQA Admin (super user) |
| `teacher` | Teacher / School Admin |
| `student` | Student |
| `parent` | Parent |
| `state_director` | State Director |

### Guards (`src/lib/auth.ts`)

Three helpers wrap every protected route. Each returns either an `AuthContext` or a `NextResponse` error, so callers must check with `isAuthError()` before using the result.

| Helper | Behavior | Failure |
|---|---|---|
| `requireAuth()` | Requires a signed-in Clerk session. | `401 Unauthorized` |
| `requirePermission(permission)` | Requires sign-in plus a specific permission. | `401` if signed out, `403 Forbidden` if the role lacks the permission |
| `isAuthError(result)` | Type guard: is the result an error `NextResponse`? | n/a |

`getAuthContext()` reads `userId` plus `role`, `schoolId`, and `stateId` from the session token's `metadata` claim. These come from Clerk `publicMetadata`, surfaced into the session via Clerk's custom claims configuration.

```ts
export interface AuthContext {
  userId: string;            // Clerk user ID
  role: Role | undefined;
  schoolId: string | undefined;
  stateId: string | undefined;
}
```

### Permission map

The permission keys referenced across routes:

| Permission | Roles allowed |
|---|---|
| `events:create`, `events:edit`, `events:delete` | `admin` |
| `teams:create`, `teams:edit` | `admin`, `teacher` |
| `teams:delete` | `admin` |
| `users:manage`, `users:view_all` | `admin` |
| `users:view_school` | `admin`, `teacher` |
| `admin:access` | `admin` |

`admin:access` gates every `/api/admin/*` route. The team and school self-link routes do not use a permission key, they enforce ownership and role inline.

!!! warning "Many read routes are public"
    `GET` handlers for events, single events, event documents, teams, single teams, schools, single schools, leaderboard, and stats run with no auth guard at all. They are intended to back the public leaderboard and event listings. See the per-route pages for specifics, and note the unauthenticated write paths flagged on the [events](events.md) page.

## Response shape

Most routes return a consistent envelope:

```json
{ "success": true, "data": ... }
```

On error:

```json
{ "success": false, "error": "Human readable message" }
```

Exceptions to the convention:

- `GET /api/users` and `GET /api/admin/entities` add extra top-level keys (`totalCount`, or `table` + `fields`) alongside `success` and `data`.
- The webhook routes (`/api/webhooks/clerk`, `/api/webhooks/stripe`) do not use this envelope. Clerk returns plain text (`"OK"`); Stripe returns `{ "received": true }`.

## Status codes

| Code | Meaning in this API |
|---|---|
| `200` | Success. Note: some failure cases (for example `GET /api/stats`) still return `200` with `success: false`. |
| `400` | Missing or invalid input (bad params, missing body field, invalid role, missing webhook signature). |
| `401` | Not signed in (`requireAuth` / `requirePermission`). |
| `403` | Signed in but lacks the required permission or ownership. |
| `404` | Record not found (single event, team, school). |
| `500` | Unhandled error, usually an Airtable failure or missing env config. |

## How routes wrap the Airtable layer

`src/lib/airtable.ts` owns all reads and writes. Patterns to know:

- **Lazy base init.** `getBase()` builds the Airtable client on first use and throws if `AIRTABLE_API_KEY` or `AIRTABLE_BASE_ID` is missing. Several routes (events, teams, stats, documents, and all admin routes) define their own local `getBase()` instead of importing the shared one. They are functionally identical.
- **Lookup caches.** Divisions, Categories, and States are loaded once into in-memory `Map`s (`loadDivisionsCache`, etc.) and reused to resolve linked-record IDs into display names. The cache persists for the lifetime of the serverless instance.
- **Linked records.** Helpers `getFirstLinkedId()` and `getLinkedIds()` unwrap Airtable link fields (arrays of record IDs). Attachments are unwrapped with `getImageUrl()`.
- **Table name mapping.** Airtable table names do not match API nouns. Schools are the `Charter` table, students are the `Students` table, scorecards are `BBQ Report Cards`. See the [Airtable schema](../data-model/airtable-schema.md) page.

!!! warning "Verify: silent write failures"
    The user-sync writers (`updateUser`, `updateUserRole`, `suspendUser`) catch their own errors and return `void` without rethrowing. A route can therefore respond `success: true` even when the Airtable write found no matching user or failed. Treat these as best-effort mirrors of Clerk, not authoritative writes.

## Pagination

There is effectively no cursor pagination. Behavior by route:

- `GET /api/users` accepts `limit` (default 50) and `offset` (default 0) and passes them to Clerk's `getUserList`. It returns `totalCount`. This is the only true paginated route.
- Search routes (`teams`, `schools`, `students`) cap results in the data layer: up to 200 records when listing all, or the first 20 matches when a query is supplied.
- List reads use Airtable `maxRecords` caps (for example events 100, invoices 200, scorecards 500). There is no way to page past these caps via the API.

## Caching

Public read routes set `Cache-Control` headers for edge caching:

| Route | Header |
|---|---|
| `GET /api/events` | `public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/leaderboard` | `public, s-maxage=10, stale-while-revalidate=30` |
| `GET /api/stats` | `public, s-maxage=120, stale-while-revalidate=300` |

Other routes are uncached.

## Audit logging

Mutating admin and user routes call `logAuditEvent(userId, action, targetType, targetId, details?)`, which writes a row to the Airtable `Audit Log` table. Audit logging is best-effort: it catches its own errors and never breaks the main operation. Actions seen in code include `event.created`, `event.deleted`, `role.assigned`, `team.self_linked`, and `school.self_linked`.
