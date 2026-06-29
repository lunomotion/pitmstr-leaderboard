# API: events

Routes for events and their attached documents. Events map to the Airtable `Events` table. Document attachments are stored in a `Documents` attachment field on that same table.

Source files:

- `src/app/api/events/route.ts`
- `src/app/api/events/[eventId]/route.ts`
- `src/app/api/events/[eventId]/documents/route.ts`

---

## `GET /api/events`

List events, with optional filters.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `getEvents()` |

### Request

Query parameters (all optional):

| Param | Type | Notes |
|---|---|---|
| `status` | `upcoming` \| `live` \| `completed` \| `cancelled` | Filtered in `getEvents` after status is computed. |
| `division` | string | Matched against the resolved division name. |
| `state` | string | Matched against state abbreviation or full name. |
| `limit` | number | Maps to Airtable `maxRecords`. Default 100. |

### Response

```json
{ "success": true, "data": [ { "id": "rec...", "name": "...", "date": "...", "division": "...", "status": "upcoming", "categories": ["Brisket"] } ] }
```

Sent with `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

!!! note "Status is computed, not stored"
    `getEvents` reads an optional `Status Override` field. If absent, status is derived from `Event Date` versus now (future = `upcoming`, same day = `live`, past = `completed`). If categories are missing in Airtable, the layer falls back to `["Brisket", "Pork", "Chicken"]`.

### Side effects

None. Read only. Loads the Divisions, Categories, and States caches on first call.

---

## `POST /api/events`

Create an event.

| | |
|---|---|
| **Auth** | `requirePermission("events:create")` -> `admin` only |
| **Handler** | `POST`, direct `base("Events").create(...)` |

### Request

JSON body:

| Field | Required | Maps to Airtable field |
|---|---|---|
| `name` | yes | `Event Name` |
| `date` | yes | `Event Date` |
| `location` | no | `Location` (falls back to `"{city}, {state}"`) |
| `city` | no | used only to build `Location` |
| `state` | no | `State` (linked record, written as `[state]`) |
| `division` | no | `Division` (linked record, written as `[division]`) |
| `description` | no | `Description` |
| `categories` | no | `Category` (array of linked record IDs) |

Returns `400` if `name` or `date` is missing.

!!! warning "Verify: linked-record IDs expected"
    `state`, `division`, and each `categories` entry are written directly as Airtable link arrays, so they must be Airtable record IDs, not display names. The `location` fallback produces a literal `", "` when both `city` and `state` are empty.

### Response

```json
{ "success": true, "data": { "id": "rec...", "name": "...", "date": "...", "location": "..." } }
```

### Side effects

- Creates one row in `Events`.
- Writes an `Audit Log` row: action `event.created`, target type `event`.

---

## `DELETE /api/events?id={eventId}`

Delete an event.

| | |
|---|---|
| **Auth** | `requirePermission("events:delete")` -> `admin` only |
| **Handler** | `DELETE`, direct `base("Events").destroy(eventId)` |

### Request

`id` query parameter (the Airtable record ID). Returns `400` if missing.

### Response

```json
{ "success": true, "message": "Event deleted successfully" }
```

### Side effects

- Destroys the `Events` row.
- Writes an `Audit Log` row: action `event.deleted`, target type `event`.

---

## `GET /api/events/{eventId}`

Fetch a single event.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `getEvent(eventId)` |

### Response

`200` with `{ "success": true, "data": <event> }`, or `404` `{ "success": false, "error": "Event not found" }` if `getEvent` returns null. Status is computed the same way as in the list route.

### Side effects

None. Read only.

---

## `GET /api/events/{eventId}/documents`

List documents attached to an event.

| | |
|---|---|
| **Auth** | None |
| **Handler** | `GET`, reads the `Documents` attachment field |

### Response

```json
{
  "success": true,
  "data": [
    { "id": "att...", "name": "[FLYER] spring.pdf", "type": "flyer", "url": "https://...", "uploadedAt": "...", "size": "240 KB" }
  ]
}
```

`type` is inferred from the filename by `inferDocType()` (`flyer`, `w9`, `invoice`, `logistics`, `rules`, or `other`). `uploadedAt` is the event record's `createdTime`, not a per-file timestamp.

### Side effects

None. Read only.

---

## `POST /api/events/{eventId}/documents`

Upload a document to an event.

| | |
|---|---|
| **Auth** | None |
| **Handler** | `POST`, base64 data-URI append to `Documents` |

### Request

`multipart/form-data`:

| Field | Required | Notes |
|---|---|---|
| `file` | yes | Max 10 MB, else `400`. |
| `type` | no | Defaults to `other`. Uppercased and prefixed onto the filename as `[TYPE] originalname`. |

The file is read into a buffer, base64-encoded, and appended to the existing attachments as a `data:{mime};base64,...` URL. Airtable ingests the data URI and rehosts the file. The route then re-fetches the record to return the new attachment's real ID and URL.

### Response

```json
{ "success": true, "data": { "id": "att...", "name": "[RULES] rules.pdf", "type": "rules", "url": "https://...", "uploadedAt": "...", "size": "1.2 MB" } }
```

### Side effects

- Updates the `Documents` attachment field on the `Events` row (append).

!!! danger "No auth on document write paths"
    Both `POST` and `DELETE` on `/api/events/{eventId}/documents` run with no auth guard. Any caller who knows an event ID can upload or remove event documents. This appears unintentional given that event create/delete require `admin`. Add a permission guard before relying on this in production.

---

## `DELETE /api/events/{eventId}/documents?docId={attachmentId}`

Remove a document from an event.

| | |
|---|---|
| **Auth** | None |
| **Handler** | `DELETE`, rewrites the `Documents` field minus the target attachment |

### Request

`docId` query parameter (the attachment ID, as returned by the list route). Returns `400` if missing.

### Response

```json
{ "success": true }
```

### Side effects

- Updates the `Documents` attachment field, filtering out the attachment whose `id` matches `docId`. Remaining attachments are re-sent by URL so Airtable keeps them.
