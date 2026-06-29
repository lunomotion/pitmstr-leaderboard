# Airtable Schema

Base ID: `appaCm0sgJFrCRmx2` (env `AIRTABLE_BASE_ID`).

This page documents every field the **code actually reads or writes**, table by table. Types are inferred from how each field is used in TypeScript (`record.get(...) as ...`), from the seed scripts, and from Airtable conventions. Airtable does not expose its schema to this app at runtime, so a field's exact Airtable type (for example single-line text vs long text, or single select vs plain text) cannot always be confirmed from code. Where the code cannot prove the type, the column says so.

!!! info "How to read the Type column"
    - **Link** means an Airtable "Link to another record" field. In the API it comes back as an array of record IDs (`["rec..."]`), which the code unwraps with `getFirstLinkedId()` (first ID) or `getLinkedIds()` (all IDs).
    - **Lookup / Rollup** means a field whose value is pulled or aggregated from a linked record. The app reads these but never writes them.
    - **Attachment** comes back as an array of objects with `url`, `filename`, `size`, `type`. The code reads `[0].url` via `getImageUrl()`.
    - **Formula** is computed inside Airtable; the app never sets it.

---

## Events

Table name: `Events`. Read/written by `getEvents()`, `getEvent()`, `getEventLeaderboard()` in `src/lib/airtable.ts`, the documents route, and `scripts/seed-demo-data.ts`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Event Name` | Text | Display name. Also the sort/match key in scripts. |
| `Event Date` | Date | Event date (ISO string). Default sort is `Event Date` descending. Drives the computed `upcoming` / `live` / `completed` status. |
| `Location` | Text | Free text, expected as `"City, State"`. Code derives `city` by splitting on the first comma. |
| `Description` | Text | Optional event description. |
| `State` | Link (to States, single) | The hosting state association. Read via `getFirstLinkedId`. |
| `Division` | Link (to Divisions, single) | The division this event belongs to. |
| `Category` | Link (to Categories, multiple) | Food categories contested. Read via `getLinkedIds`. |
| `Teams` | Link (to Teams, multiple) | Registered teams. The leaderboard reads its team set from here. |
| `Team Count` | Number (likely rollup/count) | Count of registered teams, surfaced as `registeredTeams`. |
| `Event Photo` | Attachment | Event hero image, surfaced as `imageUrl`. |
| `Status Override` | Text or Single select | Optional manual status. If set to `live`, `upcoming`, `completed`, or `cancelled` (case-insensitive) it overrides the date-derived status. |
| `Documents` | Attachment (multiple) | Event files (flyer, rules, logistics, etc.). Managed by `src/app/api/events/[eventId]/documents/route.ts`. |

!!! warning "Verify: status is mostly computed, not stored"
    `Events` has no first-class `Status` field. The app computes status from `Event Date` at read time and only honours an explicit `Status Override`. There is no stored `Max Teams` / `Host School` field either; `maxTeams` and `hostSchool` are always `undefined` in code.

---

## Teams

Table name: `Teams`. Read/written by `getTeam()`, `searchTeams()`, `getTeamCountsByCharter()`, and the seeder.

| Field | Type | Purpose |
| --- | --- | --- |
| `Team Name` | Text | Display name and search key. |
| `Advisor / Coach` | Text | Coach name. Mapped to `coach`. |
| `State` | Text | **Plain text** state on the team (for example `"TX"`), written directly by the seeder as a string. Not a link. |
| `Charter` | Link (to Charter, single) | The school the team belongs to. The only field requested by `getTeamCountsByCharter()`. |
| `Division` | Link (to Divisions, single) | The team's division. Resolved to a division name via the cache. |

!!! warning "Verify: `State` is denormalized on Teams"
    On `Teams`, `State` is read as a raw string (`record.get("State") as string`). On `Events` and `Charter`, `State` is a **link** to the `States` table. Same field name, different type, depending on the table. Do not assume they behave alike.

---

## Charter (Schools)

Table name: `Charter`. This is the **school** entity. Read/written by `getSchool()`, `searchSchools()`, the invoice seeder, and `getTeam()` (to resolve a team's school name).

| Field | Type | Purpose |
| --- | --- | --- |
| `Charter Name` | Text | School / charter display name. Mapped to `school.name`. |
| `City` | Text | City. |
| `County` | Text | Optional. Mapped to `district` in the `School` type. |
| `State` | Link (to States, single) | The school's state association. Resolved via `getStateInfo`. |
| `Charter Photo` | Attachment | School logo, surfaced as `logoUrl`. |
| `Teams` | Link (to Teams, multiple) | Teams fielded by this school. |

!!! note "Contact fields exist in the type but not in code reads"
    The `School` TypeScript interface declares `contactName`, `contactEmail`, `contactPhone`, but `getSchool()` / `searchSchools()` never read them. Billing contact details live on the `Invoices` table instead. Treat any `Charter` contact fields as unused by the app until verified in Airtable.

---

## Students (Team Members)

Table name: `Students`. Read by `getTeamMembers()` and `searchStudents()`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Member Name` | Text | Student name. Mapped to `name`. |
| `Team` | Link (to Teams) | The team the student belongs to. `getTeamMembers()` filters with `FIND('<teamId>', ARRAYJOIN({Team}))`. |
| `Role` | Text | Optional role (for example "Pitmaster"). |
| `Photo` | Attachment | Student photo, surfaced as `photoUrl`. |
| `Email` | Text | Optional email. |

!!! warning "Verify: declared-but-unread student fields"
    The `TeamMember` type also lists `phone`, `shirtSize`, `allergies`. No code reads these from `Students`. They may or may not exist as Airtable columns. FERPA-sensitive fields (allergies, contact info) should be confirmed in Airtable before being surfaced anywhere.

---

## Turn-Ins

Table name: `Turn-Ins`. This is the most schema-ambiguous table in the base because two parts of the codebase model it differently.

**Interpretation A: physical box submission** (production admin view, `src/app/api/admin/turn-ins/route.ts`):

| Field | Type | Purpose |
| --- | --- | --- |
| `Name` | Text or autonumber | Record label. |
| `Team` | Link (to Teams) | Team that turned in the box. |
| `Event` | Link (to Events) | Event the turn-in belongs to. |
| `Category` | Link (to Categories) | Food category turned in. |
| `Turn-In Time` | Date/time | When the box was submitted. |
| `Box Photo` | Attachment | Photo of the submitted box. |
| `Notes` | Text | Free notes. |
| `Report Cards` | Link (to BBQ Report Cards) | The judge scorecards generated for this turn-in. |
| `Scorecard Count` | Number (count/rollup) | How many scorecards exist for this turn-in. |
| `Team Name` | Lookup | Team name pulled from the linked team. |
| `Event Name` | Lookup | Event name pulled from the linked event. |
| `Category Description` | Lookup | Category description pulled from the linked category. |

**Interpretation B: raw MEAT scores** (seeder `scripts/seed-demo-data.ts` and the PDF route `src/app/api/reports/event-results/route.ts`):

| Field | Type | Purpose |
| --- | --- | --- |
| `MEAT_M` | Number | Mis En Place component score. |
| `MEAT_E` | Number | Taste component score. |
| `MEAT_A` | Number | Appearance component score. |
| `MEAT_T` | Number | Texture component score. |
| `Weighted Score` | Number | `0.1*M + 0.5*E + 0.2*A + 0.2*T`, written by the seeder. |
| `Submitted At` | Date/time | When the score was recorded. |
| `Notes` | Text | Seeder writes `DEMO-Judge-N` here. |

!!! warning "Verify: which fields actually exist on Turn-Ins"
    The seeder writes `MEAT_*` directly onto `Turn-Ins`, and `event-results` reads `MEAT_*` back from `Turn-Ins` to build the PDF. Meanwhile the live scoring form (`/api/scoring/submit`) writes scores to `BBQ Report Cards`, not `Turn-Ins`. So the base may carry MEAT data in **two places** depending on whether records came from the seeder or from the real form. The seeder even wraps its create in a `try/catch` for `UNKNOWN_FIELD_NAME` and retries with only the link + MEAT fields, which is a strong sign these extra fields (`Weighted Score`, `Submitted At`, `Notes`) may not exist in the real base. Confirm the live `Turn-Ins` columns in Airtable before relying on either interpretation.

---

## BBQ Report Cards

Table name: `BBQ Report Cards`. This is the real scoring system of record for the live app: one record per judge, per team, per category. Written by `/api/scoring/submit`, read by `/api/admin/scorecards` and `getEventLeaderboard()`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Name` | Text or autonumber | Record label. |
| `Mis En Place (out of 10)` | Number (0-10) | MEAT "M" component. |
| `Taste (out of 55)` | Number (0-55) | MEAT "E" (EAT) component. |
| `Appearance (out of 15)` | Number (0-15) | MEAT "A" component. |
| `Texture (out of 20)` | Number (0-20) | MEAT "T" component. |
| `Total Score` | Formula (Number, out of 100) | Sum of the four components. Computed by Airtable; the app sends only the components. Read by the leaderboard. |
| `Total Penalty Points` | Number | Penalty deductions, surfaced in the admin scorecards view. |
| `Judge` | Link (to Judges) | Judge who scored. Resolved by name or record ID at submit time. |
| `Team` | Link (to Teams) | Team scored. |
| `Event` | Link (to Events) | Event the score belongs to. |
| `Category` | Link (to Categories) | Food category scored. |
| `Team Name (Lookup)` | Lookup | Team name from the linked team. |
| `Event Name (Lookup)` | Lookup | Event name from the linked event. |
| `Category Name (Lookup)` | Lookup | Category name from the linked category. |
| `Judge Name (Lookup)` | Lookup | Judge name from the linked judge. |

!!! note "No Notes field here"
    `/api/scoring/submit` explicitly comments that "BBQ Report Cards table has no Notes field" and does not write one. The MEAT score ranges (M 0-10, E 0-55, A 0-15, T 0-20) are validated in that route before any write.

---

## Divisions

Table name: `Divisions`. Read by `loadDivisionsCache()`, `getDivisions()`, and `/api/admin/lookups?table=divisions`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Division Name` | Text | Division name (for example `HSBBQ Division`). The cache key. |
| `Code` | Text | Short code (for example `HSBBQ`). |
| `Grade Range` | Text | For example `K9-12`. |
| `Age Range` | Text | For example `14-18`. |

!!! note "Division naming convention"
    Mike's official naming is `[ACRONYM] Division` (KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ). The seeder still creates legacy short names (`HSBBQ`, `MSBBQ`). The canonical list and metadata live in the `DIVISIONS` constant in `src/lib/types.ts`.

---

## Categories

Table name: `Categories`. Read by `loadCategoriesCache()`, `getCategories()`, `/api/admin/lookups?table=categories`, and category lookups during scoring.

| Field | Type | Purpose |
| --- | --- | --- |
| `Category Name` | Text | Category name (for example `Brisket`). The cache key and the value matched by the scoring form. |
| `Category Description` | Text | Inferred. Surfaced on `Turn-Ins` as the `Category Description` lookup, so a description field exists on `Categories`. |

!!! warning "Verify: `Category Description`"
    The app only ever reads `Category Description` as a **lookup on Turn-Ins**, never directly off `Categories`. The source field on `Categories` is assumed to be named `Category Description` but this is not proven by a direct read. Confirm in Airtable.

---

## States

Table name: `States`. Read by `loadStatesCache()`, `getStates()`, and `/api/admin/lookups?table=states`. Written by the seeder.

| Field | Type | Purpose |
| --- | --- | --- |
| `State Name` | Text | Full state name (for example `Texas`). |
| `Abbreviation` | Text | Two-letter abbreviation (for example `TX`). Preferred for display; the brand format `TXHSBBQA` is derived in `src/lib/format.ts`. |

---

## Users

Table name: `Users`. The Airtable mirror of Clerk users. Read/written by `createUser()`, `getUserByClerkId()`, `updateUser()`, `updateUserRole()`, `suspendUser()`. Shape matches the exported `AirtableUser` interface.

| Field | Type | Purpose |
| --- | --- | --- |
| `Clerk ID` | Text | Clerk user ID. The join key between Clerk and Airtable; filtered with `{Clerk ID} = '...'`. |
| `Email` | Text | User email. |
| `First Name` | Text | Given name. |
| `Last Name` | Text | Family name. |
| `Role` | Text or Single select | App role (NHSBBQA Admin, Teacher, Student/Parent, State Director). `null` until assigned. |
| `Status` | Text or Single select | `pending` on create, `active` after role assignment, `suspended` on Clerk delete. |
| `School` | Link (to Charter) | Optional school assignment, set by `updateUserRole`. |
| `State` | Link (to States) | Optional state assignment, set by `updateUserRole`. |
| `Team` | Link (to Teams) | Optional team assignment, set by `updateUserRole`. |
| `Created At` | Date/time | ISO timestamp set on create. |
| `Last Login` | Date/time | Updated from the Clerk `user.updated` webhook path. |

---

## Audit Log

Table name: `Audit Log`. Append-only trail written by `logAuditEvent()`. Writes are best-effort and never throw.

| Field | Type | Purpose |
| --- | --- | --- |
| `Timestamp` | Date/time | When the action happened (ISO). |
| `Action` | Text | Action string (caller-defined). |
| `Target Type` | Text or Single select | One of `event`, `team`, `user`, `school`. |
| `Target ID` | Text | ID of the affected record. |
| `User` | Link (to Users) | The acting user, resolved from their Clerk ID. Omitted if the user is not found. |
| `Details` | Long text | Pretty-printed JSON blob of extra context. |
| `IP Address` | Text | Optional request IP. |

---

## Invoices

Table name: `Invoices`. A dedicated billing table (not bolted onto `Charter`). Read/written by `getInvoices()`, `getInvoice()`, `createInvoice()`, `updateInvoice()`, and the invoice seeder. Shape matches the `Invoice` interface in `src/lib/types.ts`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Invoice Number` | Text or autonumber | Human-facing invoice number. Falls back to the record ID if empty. |
| `Charter` | Link (to Charter) | The billed school. |
| `Charter Name` | Lookup (string array) | School name pulled from the linked charter; code reads index `[0]`. |
| `Billing Contact` | Text | Contact person. |
| `Billing Email` | Text | Contact email. |
| `Billing Phone` | Text | Contact phone. |
| `Payer Type` | Single select | One of: Teacher, Office Admin, CTE Director, Parent, Sponsor, In-Kind Donor. |
| `AEU Type` | Single select | Authorized Educational Unit type (11 values, see `AEU_TYPES`). |
| `Payment Method` | Single select | Check, Credit Card, Purchase Order. |
| `Payment Status` | Single select | Unpaid, Pending, Paid, Refunded. Filterable in `getInvoices()`. |
| `Total Amount` | Number / currency | Invoice total. `CHARTER_FEE` is $250 per team. |
| `Tax Exempt` | Checkbox | Whether the payer is tax exempt. |
| `Tax Exempt Number` | Text | Exemption number when applicable. |
| `Paid At` | Date/time | Set when payment completes (for example via the Stripe webhook). |
| `Notes` | Long text | Free notes. |

!!! note "Record creation order"
    `getInvoices()` does not sort in Airtable. It maps records then sorts by Airtable's automatic `createdTime` (newest first) in JavaScript. New invoices are always created with `Payment Status = "Unpaid"`.

---

## Vendor Documents

Table name: `Vendor Documents`. Supporting documents schools need for payment processing. Read by `getVendorDocuments()`. Shape matches `VendorDocument`.

| Field | Type | Purpose |
| --- | --- | --- |
| `Type` | Single select | One of: W-9, ACH, Insurance, Sole Source, Procurement, District Adoption. |
| `File` | Attachment | The document file. Code reads `[0].filename` and `[0].url`. |
| `Active` | Checkbox | Whether the doc is current. `getVendorDocuments()` keeps records where `Active !== false` and a file URL exists. |

---

## Judges

Table name: `Judges`. Referenced **only** in `src/app/api/scoring/submit/route.ts` to resolve a judge link on a scorecard.

| Field | Type | Purpose |
| --- | --- | --- |
| `Judge Name` | Text | Judge's name. Matched case-insensitively, or the record is matched by `RECORD_ID()`, when linking a scorecard's `Judge`. |

!!! warning "Verify: Judges is undocumented in `TABLES`"
    `Judges` is not in the `TABLES` constant and is touched by exactly one route. If a judge cannot be matched, the scorecard is still created without a `Judge` link (the lookup failure is swallowed). Confirm the table exists and what other columns it has before building on it. The string `Scorecards` appears only in the diagnostic script `scripts/check-fields.ts` and is **not** a table the app uses.
