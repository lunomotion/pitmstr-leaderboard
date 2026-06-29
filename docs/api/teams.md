# API: teams

Routes for teams. Teams map to the Airtable `Teams` table. A team links to one `Charter` (school) and one `Division`.

Source files:

- `src/app/api/teams/route.ts`
- `src/app/api/teams/[teamId]/route.ts`

---

## `GET /api/teams`

List or search teams.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `searchTeams(query)` |

### Request

| Param | Type | Notes |
|---|---|---|
| `q` | string | Optional search query. When empty, the route passes a single space to `searchTeams`, which returns all teams. |

`searchTeams` matches `q` against team name and state (case-insensitive substring). Listing all returns up to 200 teams; a query returns the first 20 matches. Each team's school name is resolved by a per-row `Charter` lookup.

### Response

```json
{ "success": true, "data": [ { "id": "rec...", "name": "...", "schoolId": "rec...", "schoolName": "...", "division": "...", "coach": "...", "state": "TX" } ] }
```

### Side effects

None. Read only.

---

## `POST /api/teams`

Create a team.

| | |
|---|---|
| **Auth** | `requirePermission("admin:access")` -> `admin` only |
| **Handler** | `POST`, direct `base("Teams").create(...)` |

!!! note "Admin-only despite the teacher permission"
    The roles map grants `teams:create` to `admin` and `teacher`, but this route checks `admin:access`, so in practice only admins can create teams via the API.

### Request

JSON body:

| Field | Required | Maps to Airtable field |
|---|---|---|
| `name` | yes | `Team Name` |
| `state` | no | `State` (plain text, defaults to `""`) |
| `coach` | no | `Advisor / Coach` |
| `schoolId` | no | `Charter` (linked record, written as `[schoolId]`) |
| `divisionId` | no | `Division` (linked record, written as `[divisionId]`) |

Returns `400` if `name` is missing.

### Response

```json
{ "success": true, "data": { "id": "rec...", "name": "...", "state": "..." } }
```

### Side effects

- Creates one row in `Teams`. No audit log is written.

---

## `DELETE /api/teams?id={teamId}`

Delete a team.

| | |
|---|---|
| **Auth** | `requirePermission("admin:access")` -> `admin` only |
| **Handler** | `DELETE`, direct `base("Teams").destroy(teamId)` |

### Request

`id` query parameter. Returns `400` if missing.

### Response

```json
{ "success": true, "message": "Team deleted successfully" }
```

### Side effects

- Destroys the `Teams` row. No audit log is written.

---

## `GET /api/teams/{teamId}`

Fetch a single team with its members and school.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `getTeam()`, `getTeamMembers()`, `getSchool()` |

### Behavior

1. `getTeam(teamId)` loads the team and resolves its division and linked charter (school name + ID). Returns `404` if not found.
2. `getTeamMembers(teamId)` loads linked `Students` via an Airtable `filterByFormula` of `FIND('{teamId}', ARRAYJOIN({Team}))`. Errors here are caught and members default to `[]`.
3. If the team has a `schoolId`, `getSchool()` loads the charter record. Errors are caught and `school` defaults to `null`.

!!! warning "Verify: roster is public and FERPA-relevant"
    This unauthenticated route returns the student roster (`Member Name`, role, photo, email from the `Students` table). Given the project's FERPA requirement, confirm that exposing student PII on a public endpoint is intended.

### Response

```json
{
  "success": true,
  "data": {
    "team": { "id": "rec...", "name": "...", "division": "...", "coach": "...", "state": "..." },
    "members": [ { "id": "rec...", "name": "...", "role": "...", "email": "...", "photoUrl": "..." } ],
    "school": { "id": "rec...", "name": "...", "city": "...", "state": "...", "teams": ["rec..."] }
  }
}
```

### Side effects

None. Read only.
