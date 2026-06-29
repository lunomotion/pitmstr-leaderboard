# API: schools

Routes for schools. In Airtable, schools are the `Charter` table. The API noun is "schools" but every underlying field is on `Charter`.

Source files:

- `src/app/api/schools/route.ts`
- `src/app/api/schools/[schoolId]/route.ts`

---

## `GET /api/schools`

List or search schools.

| | |
|---|---|
| **Auth** | None (public, stated in a source comment) |
| **Handler** | `GET` -> `searchSchools(query)` |

### Request

| Param | Type | Notes |
|---|---|---|
| `q` | string | Optional. When empty, the route passes a single space so `searchSchools` returns all. |

`searchSchools` mirrors `searchTeams`: it matches `q` against charter name, city, and resolved state name (case-insensitive substring). Listing all returns up to 200 schools; a query returns the first 20 matches.

### Response

```json
{
  "success": true,
  "data": [
    { "id": "rec...", "name": "Charter Name", "city": "...", "state": "TX", "district": "County", "logoUrl": "https://...", "teams": ["rec..."] }
  ]
}
```

Field mapping: `name` <- `Charter Name`, `district` <- `County`, `logoUrl` <- `Charter Photo` attachment, `teams` <- linked `Teams` IDs, `state` resolved from the linked `States` record (abbreviation preferred, else full name).

### Side effects

None. Read only.

---

## `GET /api/schools/{schoolId}`

Fetch a single school with its teams.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `getSchool()`, then `getTeam()` per linked team |

### Behavior

1. `getSchool(schoolId)` loads the `Charter` record. Returns `404` `{ "success": false, "error": "School not found" }` if not found.
2. For each ID in the school's `teams` array, `getTeam()` is called sequentially. Per-team errors are caught and that team is skipped.

### Response

```json
{
  "success": true,
  "data": {
    "school": { "id": "rec...", "name": "...", "city": "...", "state": "...", "district": "...", "logoUrl": "...", "teams": ["rec..."] },
    "teams": [ { "id": "rec...", "name": "...", "division": "...", "coach": "...", "state": "..." } ]
  }
}
```

### Side effects

None. Read only.

!!! note "No write routes for schools"
    There is no `POST`, `PATCH`, or `DELETE` for schools in the API. School (charter) creation and activation happen outside these routes, for example directly in Airtable or via admin tooling. The roles map reserves `schools:activate` for `admin` and `schools:request` for `teacher`, but no route currently consumes those permissions.
