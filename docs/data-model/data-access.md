# Data Access Layer

Almost every read and write to Airtable goes through `src/lib/airtable.ts`. This page documents every exported helper in that file: its signature, what it does, how it caches, and how it handles errors. If you are adding a feature, prefer extending these helpers over calling Airtable directly.

!!! warning "Some routes bypass this module"
    A handful of API routes build their own Airtable client instead of importing from `src/lib/airtable.ts`. They are listed at the [end of this page](#routes-that-call-airtable-directly). Keep them in mind when you rename a table or field.

## Module internals

### Lazy base client

`getBase()` (not exported) constructs the Airtable client on first use and memoizes it in a module-level `_base`. It throws a descriptive error if `AIRTABLE_API_KEY` or `AIRTABLE_BASE_ID` is missing, so build time stays clean and failures surface only on the request that actually needs Airtable.

### Field helpers

Three small, non-exported helpers normalize Airtable's array-shaped fields:

| Helper | Returns | Use |
| --- | --- | --- |
| `getFirstLinkedId(field)` | `string \| undefined` | First record ID from a link field. |
| `getLinkedIds(field)` | `string[]` | All record IDs from a link field. |
| `getImageUrl(field)` | `string \| undefined` | `url` of the first attachment. |

### Lookup caches

`States`, `Divisions`, and `Categories` are loaded once and cached in a module-level `lookupCache` of `Map`s:

```typescript
const lookupCache = {
  divisions: new Map<string, string>(),                              // id -> name
  categories: new Map<string, string>(),                             // id -> name
  states: new Map<string, { name: string; abbreviation: string }>(), // id -> info
};
```

The loaders `loadDivisionsCache()`, `loadCategoriesCache()`, `loadStatesCache()` each early-return if their map is already populated, so the lookup tables are fetched at most once per server process.

!!! note "Cache lifetime and staleness"
    The cache is per server process / serverless instance and has **no TTL or invalidation**. If an admin edits a division, category, or state name in Airtable, already-warm instances keep serving the old value until they recycle. This is fine for these slow-changing lookup tables but is worth knowing when debugging "why is the old name still showing".

The resolver helpers `getDivisionName()`, `getCategoryNames()`, `getStateInfo()` read from these caches (loading them first if needed).

---

## Read helpers: events

### `getEvents(options?)`

```typescript
getEvents(options?: {
  status?: EventStatus;
  division?: Division;
  state?: string;
  limit?: number;
}): Promise<Event[]>
```

Fetches events sorted by `Event Date` descending (default `maxRecords` 100, overridable via `limit`). Warms all three lookup caches first. For each record it resolves the linked division, state, and categories, then computes `status` from `Event Date` (or honours `Status Override`). Filters by `division`, `state` (matched against either abbreviation or full name), and `status` are applied **in JavaScript after fetch**, not in the Airtable query. Categories default to `["Brisket", "Pork", "Chicken"]` when none are linked. **Errors**: logs and rethrows.

### `getEvent(eventId)`

```typescript
getEvent(eventId: string): Promise<Event | null>
```

Fetches a single event by record ID and maps it the same way as `getEvents()`, including the status computation / override. **Errors**: logs and returns `null`.

### `getEventLeaderboard(eventId, category?)`

```typescript
getEventLeaderboard(eventId: string, category?: Category): Promise<LeaderboardEntry[]>
```

Builds the ranked leaderboard for an event. Default `category` is `"Overall"`. Steps: read `Event.Teams` for the team set; fetch up to 1000 `BBQ Report Cards` and keep those linked to this event; group by team and category, averaging `Total Score`; resolve each team via `getTeam()`; sort by score descending and assign ranks. When `category` is not `"Overall"`, only scorecards for that category are counted. **Errors**: logs and rethrows.

!!! warning "Verify: full-table scorecard scan"
    `getEventLeaderboard()` fetches **all** report cards (`maxRecords: 1000`) and filters in memory rather than using a `filterByFormula` on the event link. This is fine at demo scale but will not scale past 1000 scorecards. Flag for revisit if the league grows.

---

## Read helpers: teams, schools, students

### `getTeam(teamId)`

```typescript
getTeam(teamId: string): Promise<Team | null>
```

Fetches a team, resolves its `Division` to a name, and follows the `Charter` link to fill `schoolName` / `schoolId`. Reads `State` as plain text and `Advisor / Coach` as `coach`. **Errors**: logs and returns `null` (a failed charter lookup is caught separately and just leaves the school blank).

### `searchTeams(query)`

```typescript
searchTeams(query: string): Promise<Team[]>
```

Substring search over `Team Name` and `State`, done **client-side in JS** after fetching records. An empty or single-space query returns all teams (up to 200); otherwise it fetches up to 50 and returns the first 20 matches. Resolves division and school per match. **Errors**: logs and rethrows.

### `getTeamCountsByCharter()`

```typescript
getTeamCountsByCharter(): Promise<Record<string, number>>
```

Single-scan count of teams grouped by their `Charter` link, requesting only the `Charter` field for efficiency. Built for the billing dashboard to avoid per-row charter lookups. **Errors**: logs and returns whatever counts were accumulated (never throws).

### `getSchool(schoolId)`

```typescript
getSchool(schoolId: string): Promise<School | null>
```

Fetches a `Charter` record, resolves its `State` link, maps `County` to `district` and `Charter Photo` to `logoUrl`, and lists its linked `Teams` IDs. **Errors**: logs and returns `null`.

### `searchSchools(query)`

```typescript
searchSchools(query: string): Promise<School[]>
```

Mirrors `searchTeams()` for the `Charter` table. Searches `Charter Name`, `City`, and resolved state. Empty query returns all (up to 200); otherwise up to 50 fetched, first 20 matches returned. **Errors**: logs and rethrows.

### `getTeamMembers(teamId)`

```typescript
getTeamMembers(teamId: string): Promise<TeamMember[]>
```

Returns a team's roster from `Students`, filtered server-side with `filterByFormula: FIND('<teamId>', ARRAYJOIN({Team}))`. Maps `Member Name`, `Role`, `Photo`, `Email`. **Errors**: logs and rethrows.

### `searchStudents(query)`

```typescript
searchStudents(query: string): Promise<TeamMember[]>
```

Substring search over `Member Name` and `Email` (same all-vs-filtered pattern as the other searches). For each match it best-effort resolves the linked team's name and school via `getTeam()`. **Errors**: logs and rethrows.

---

## Read helpers: lookup tables

| Function | Signature | Notes |
| --- | --- | --- |
| `getCategories()` | `(): Promise<Category[]>` | Returns cached category names. On error logs and returns `[]`. |
| `getDivisions()` | `(): Promise<Division[]>` | Returns cached division names. On error logs and returns `[]`. |
| `getStates()` | `(): Promise<{ name: string; abbreviation: string }[]>` | Returns cached state info. On error logs and returns `[]`. |

All three just warm and read the [lookup caches](#lookup-caches).

---

## User management (Clerk sync)

These helpers keep the `Users` table in sync with Clerk. The exported `AirtableUser` interface is their common shape.

### `createUser(clerkId, email, firstName, lastName)`

```typescript
createUser(clerkId: string, email: string, firstName: string, lastName: string): Promise<AirtableUser>
```

Inserts a `Users` row with `Status = "pending"` and `Created At = now`. Returns the mapped user. **Errors**: logs and rethrows.

### `getUserByClerkId(clerkId)`

```typescript
getUserByClerkId(clerkId: string): Promise<AirtableUser | null>
```

Looks up a user via `filterByFormula: {Clerk ID} = '<clerkId>'` (`maxRecords: 1`). Resolves `Role`, `Status`, and the `School` / `State` link IDs. **Errors**: logs and returns `null`. This is the lookup most other user helpers call first.

### `updateUser(clerkId, data)`

```typescript
updateUser(clerkId: string, data: { email?; firstName?; lastName?; lastLogin? }): Promise<void>
```

Finds the user, then patches only the provided fields (`Email`, `First Name`, `Last Name`, `Last Login`). No-op if the user is not found. **Errors**: logs and swallows (returns `void`).

### `updateUserRole(clerkId, role, options?)`

```typescript
updateUserRole(clerkId: string, role: string, options?: { schoolId?; stateId?; teamId? }): Promise<void>
```

Sets `Role`, flips `Status` to `"active"`, and optionally links `School`, `State`, `Team`. Called from the admin dashboard. **Errors**: logs and swallows.

### `suspendUser(clerkId)`

```typescript
suspendUser(clerkId: string): Promise<void>
```

Sets `Status = "suspended"` (does not delete the row). Called on the Clerk `user.deleted` webhook. **Errors**: logs and swallows.

---

## Audit logging

### `logAuditEvent(userId, action, targetType, targetId, details?, ipAddress?)`

```typescript
logAuditEvent(
  userId: string,
  action: string,
  targetType: "event" | "team" | "user" | "school",
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void>
```

Writes an `Audit Log` row: `Timestamp`, `Action`, `Target Type`, `Target ID`, plus a `User` link resolved from the Clerk ID, a pretty-printed JSON `Details`, and optional `IP Address`. **Errors**: deliberately logs and swallows. Per the inline comment, "audit logging should never break the main operation".

---

## Invoices

### `getInvoices(options?)`

```typescript
getInvoices(options?: { paymentStatus?: PaymentStatus; limit?: number }): Promise<Invoice[]>
```

Fetches invoices (default `maxRecords` 200). If `paymentStatus` is given it is applied as a `filterByFormula`. Records are mapped with the internal `mapInvoiceRecord()` and sorted by Airtable's `createdTime` (newest first) in JS. **Errors**: logs and rethrows.

### `getInvoice(invoiceId)`

```typescript
getInvoice(invoiceId: string): Promise<Invoice | null>
```

Fetches and maps a single invoice. **Errors**: logs and returns `null`.

### `createInvoice(data)`

```typescript
createInvoice(data: {
  charterId; billingContact; billingEmail; billingPhone;
  payerType; aeuType; paymentMethod; totalAmount;
  taxExempt; taxExemptNumber?; notes?;
}): Promise<Invoice>
```

Creates an invoice linked to `charterId` with `Payment Status = "Unpaid"`. Optional `taxExemptNumber` and `notes` are only written when present. **Errors**: logs and rethrows.

### `updateInvoice(invoiceId, data)`

```typescript
updateInvoice(invoiceId: string, data: Partial<{ ...all invoice fields... }>): Promise<Invoice>
```

Patches only the fields present in `data` (each guarded by an `!== undefined` check), including `Payment Status` and `Paid At`. Returns the re-mapped record. **Errors**: logs and rethrows. This is the path the Stripe webhook uses to mark an invoice paid.

---

## Vendor documents

### `getVendorDocuments()`

```typescript
getVendorDocuments(): Promise<VendorDocument[]>
```

Fetches up to 50 `Vendor Documents`, maps each via the internal `mapVendorDocumentRecord()` (reading the first `File` attachment), and returns only records that are active (`Active !== false`) and have a file URL. **Errors**: logs and returns `[]`.

---

## Error-handling cheat sheet

The module is consistent: it always `console.error`s, then chooses one of three behaviours.

| Behaviour | Helpers |
| --- | --- |
| Rethrow (caller handles) | `getEvents`, `getEventLeaderboard`, `searchTeams`, `searchSchools`, `getTeamMembers`, `searchStudents`, `getInvoices`, `createInvoice`, `updateInvoice` |
| Return `null` | `getEvent`, `getTeam`, `getSchool`, `getInvoice`, `getUserByClerkId` |
| Return empty / safe default and never throw | `getCategories`, `getDivisions`, `getStates`, `getTeamCountsByCharter`, `getVendorDocuments`, `updateUser`, `updateUserRole`, `suspendUser`, `logAuditEvent` |

---

## Routes that call Airtable directly

These routes build their own Airtable client and do **not** import `src/lib/airtable.ts`. If you change a table or field name, update them too.

| Route file | Tables touched | What it does |
| --- | --- | --- |
| `src/app/api/admin/turn-ins/route.ts` | `Turn-Ins` | Lists turn-ins (box submissions) with lookups. |
| `src/app/api/admin/scorecards/route.ts` | `BBQ Report Cards` | Lists judge scorecards with MEAT breakdown. |
| `src/app/api/admin/lookups/route.ts` | `States`, `Divisions`, `Categories` | Lists lookup options for admin UIs. |
| `src/app/api/scoring/submit/route.ts` | `BBQ Report Cards`, `Categories`, `Judges` | Writes a judge's MEAT score, resolving category and judge links. |
| `src/app/api/events/[eventId]/documents/route.ts` | `Events` | CRUD over the `Documents` attachment field. |
| `src/app/api/reports/event-results/route.ts` | `Turn-Ins`, `Categories` | Reads raw `MEAT_*` from `Turn-Ins` to build the results PDF. |

!!! note "Diagnostic script"
    `scripts/check-fields.ts` is a throwaway tool that prints the fields of `BBQ Report Cards` and probes a `Scorecards` table. It is not part of the app and can be run ad hoc to inspect the live schema:

    ```bash
    npx tsx scripts/check-fields.ts
    ```
