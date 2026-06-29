# API: admin

All `/api/admin/*` routes back the NHSBBQA admin portal. Every one of them is gated by `requirePermission("admin:access")`, which resolves to `admin` only. A non-admin gets `401` (signed out) or `403` (signed in, wrong role).

Source files:

- `src/app/api/admin/lookups/route.ts`
- `src/app/api/admin/entities/route.ts`
- `src/app/api/admin/turn-ins/route.ts`
- `src/app/api/admin/scorecards/route.ts`
- `src/app/api/admin/invoices/route.ts`
- `src/app/api/admin/vendor-documents/route.ts`

---

## `GET /api/admin/lookups`

Read a reference table for dropdowns: states, divisions, or categories.

| | |
|---|---|
| **Auth** | `admin:access` |
| **Handler** | `GET`, direct read of the named table |

### Request

| Param | Required | Allowed values |
|---|---|---|
| `table` | yes | `states`, `divisions`, `categories`. Anything else returns `400`. |

### Response

Shape depends on `table`:

- `states` -> `{ id, name, abbreviation }`, sorted by name.
- `divisions` -> `{ id, name, code, gradeRange, ageRange }` (from `Division Name`, `Code`, `Grade Range`, `Age Range`).
- `categories` -> `{ id, name }`, sorted by name.

```json
{ "success": true, "data": [ { "id": "rec...", "name": "...", "abbreviation": "TX" } ] }
```

### Side effects

None. Read only.

---

## `GET /api/admin/entities`

Generic reader for ancillary tables, returning dynamic field names plus rows.

| | |
|---|---|
| **Auth** | `admin:access` |
| **Handler** | `GET`, generic table dump |

### Request

| Param | Required | Allowed values |
|---|---|---|
| `table` | yes | `Judges`, `Sponsors`, `Volunteers` (whitelist in `ALLOWED_TABLES`). Anything else returns `400`. |

Reads up to 500 records, discovers the union of field names across rows, and returns each row as a plain object keyed by those fields (plus `id`). Null/undefined fields are omitted per row.

### Response

```json
{
  "success": true,
  "table": "Judges",
  "fields": ["Name", "Email", "Certification"],
  "data": [ { "id": "rec...", "Name": "...", "Email": "..." } ]
}
```

This route adds top-level `table` and `fields` keys on top of the standard envelope.

### Side effects

None. Read only.

---

## `GET /api/admin/turn-ins`

List physical box turn-ins (a team handing in food at an event).

| | |
|---|---|
| **Auth** | `admin:access` |
| **Handler** | `GET`, reads up to 200 `Turn-Ins` records |

### Response

```json
{
  "success": true,
  "data": [
    { "id": "rec...", "name": "...", "teamName": "...", "eventName": "...", "category": "...", "turnInTime": "...", "scorecardCount": 3, "notes": "...", "hasPhoto": true }
  ]
}
```

`teamName`, `eventName`, and `category` come from Airtable lookup fields (`Team Name`, `Event Name`, `Category Description`), each unwrapped to its first value and defaulting to `"Unknown"`. `hasPhoto` is true when the `Box Photo` attachment field is a non-empty array.

### Side effects

None. Read only.

---

## `GET /api/admin/scorecards`

List judge score submissions (M.E.A.T. component breakdowns).

| | |
|---|---|
| **Auth** | `admin:access` |
| **Handler** | `GET`, reads up to 500 `BBQ Report Cards` records |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "rec...",
      "name": "...",
      "teamName": "...",
      "eventName": "...",
      "category": "...",
      "judgeName": "...",
      "scores": { "M": 9, "E": 50, "A": 13, "T": 18 },
      "totalScore": 90,
      "totalPenalty": 0
    }
  ]
}
```

Score components map to Airtable fields: `M` <- `Mis En Place (out of 10)`, `E` <- `Taste (out of 55)`, `A` <- `Appearance (out of 15)`, `T` <- `Texture (out of 20)`. `totalScore` uses the stored `Total Score` field, falling back to `M + E + A + T`. Names come from lookup fields (`Team Name (Lookup)`, `Event Name (Lookup)`, `Category Name (Lookup)`, `Judge Name (Lookup)`); judge name defaults to a dash.

### Side effects

None. Read only.

---

## `/api/admin/invoices`

Charter invoice management. Reads enrich invoices with a per-charter team count.

| | |
|---|---|
| **Auth** | `admin:access` (all three methods) |
| **Handlers** | `GET` -> `getInvoices()` + `getTeamCountsByCharter()`; `POST` -> `createInvoice()`; `PATCH` -> `updateInvoice()` |

### `GET /api/admin/invoices`

Query param `status` (optional) filters by `Payment Status` (for example `Unpaid`, `Paid`). Returns invoices (newest first, sorted in JS by `createdTime`), each enriched with `teamCount` from a single `Teams`-by-`Charter` scan. If the team-count scan fails it degrades to `0` counts rather than erroring.

```json
{ "success": true, "data": [ { "id": "rec...", "invoiceNumber": "...", "charterId": "rec...", "paymentStatus": "Unpaid", "totalAmount": 500, "teamCount": 2 } ] }
```

### `POST /api/admin/invoices`

Create an invoice. JSON body:

| Field | Required | Notes |
|---|---|---|
| `charterId` | yes | Linked `Charter` record. |
| `billingContact` | yes | |
| `billingEmail` | yes | |
| `payerType` | yes | e.g. Teacher, Office Admin, CTE Director, Parent, Sponsor, In-Kind Donor |
| `aeuType` | yes | e.g. School District |
| `paymentMethod` | yes | Check, Credit Card, Purchase Order |
| `billingPhone` | no | Defaults to `""`. |
| `teamCount` | no | Drives the amount. |
| `taxExempt` | no | Defaults to `false`. |
| `taxExemptNumber` | no | |
| `notes` | no | |

Missing any required field returns `400`. The total is computed server-side as `(teamCount || 1) * CHARTER_FEE` (the per-team charter fee constant), so a client-sent amount is ignored. New invoices are created with `Payment Status = "Unpaid"`.

```json
{ "success": true, "data": { "id": "rec...", "invoiceNumber": "...", "totalAmount": 500, "paymentStatus": "Unpaid" } }
```

### `PATCH /api/admin/invoices`

Update an invoice. JSON body must include `invoiceId` (`400` if missing); all other keys are forwarded to `updateInvoice` and applied only if present. Updatable fields include billing contact/email/phone, payer type, AEU type, payment method, payment status, total amount, tax-exempt flag/number, paid-at timestamp, and notes.

```json
{ "success": true, "data": { "id": "rec...", "paymentStatus": "Paid" } }
```

### Side effects

- `POST` creates a row in `Invoices`.
- `PATCH` updates a row in `Invoices`.
- No audit log is written for invoice routes.

---

## `GET /api/admin/vendor-documents`

List active vendor documents (W-9, ACH, Insurance, Sole Source, Procurement, District Adoption) used to assemble invoice payment packages.

| | |
|---|---|
| **Auth** | `admin:access` |
| **Handler** | `GET` -> `getVendorDocuments()` |

### Response

```json
{ "success": true, "data": [ { "id": "rec...", "type": "W-9", "fileName": "w9.pdf", "fileUrl": "https://...", "active": true } ] }
```

`getVendorDocuments` reads up to 50 `Vendor Documents` rows and returns only those that are active and have a file URL. `active` is true unless the Airtable `Active` checkbox is explicitly `false`.

### Side effects

None. Read only.
