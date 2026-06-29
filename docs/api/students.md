# API: students

One route. Students map to the Airtable `Students` table (team members). Unlike the public team/school read routes, this list endpoint is admin-gated.

Source file: `src/app/api/students/route.ts`

---

## `GET /api/students`

List or search students.

| | |
|---|---|
| **Auth** | `requirePermission("users:view_all")` -> `admin` only |
| **Handler** | `GET` -> `searchStudents(query)` |

### Request

| Param | Type | Notes |
|---|---|---|
| `q` | string | Optional. When empty, the route passes a single space so `searchStudents` returns all. |

`searchStudents` matches `q` against member name and email (case-insensitive substring). Listing all returns up to 200 students; a query returns the first 20 matches. For each student, the linked `Team` is resolved (best-effort) to attach `teamName` and `schoolName`.

### Response

```json
{
  "success": true,
  "data": [
    { "id": "rec...", "name": "Member Name", "teamId": "rec...", "role": "Pitmaster", "email": "...", "photoUrl": "https://...", "teamName": "...", "schoolName": "..." }
  ]
}
```

Field mapping: `name` <- `Member Name`, `role` <- `Role`, `photoUrl` <- `Photo` attachment, `teamId` <- first linked `Team` ID.

### Side effects

None. Read only.

!!! note "FERPA note"
    This route is correctly gated to admins, but the same student records are also returned unauthenticated through `GET /api/teams/{teamId}` (the `members` array). See the [teams](teams.md) page for that flag.
