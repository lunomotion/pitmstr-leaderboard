# API: users

Routes for managing Clerk users and their role/linkage metadata. The user list comes from Clerk (not Airtable). Role and link writes update Clerk `publicMetadata` first, then mirror to the Airtable `Users` table.

Source files:

- `src/app/api/users/route.ts`
- `src/app/api/users/[userId]/role/route.ts`
- `src/app/api/users/[userId]/team/route.ts`
- `src/app/api/users/[userId]/school/route.ts`

---

## `GET /api/users`

List Clerk users.

| | |
|---|---|
| **Auth** | `requirePermission("users:manage")` -> `admin` only |
| **Handler** | `GET` -> Clerk `clerkClient().users.getUserList(...)` |

### Request

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | none | If present, passed to Clerk as `query`. |
| `limit` | number | 50 | Page size. |
| `offset` | number | 0 | Page offset. |

When no `q` is given, results are ordered `-created_at` (newest first). When `q` is given, Clerk's default ordering applies.

### Response

```json
{
  "success": true,
  "data": [
    { "id": "user_...", "email": "...", "firstName": "...", "lastName": "...", "imageUrl": "...", "role": "teacher", "schoolId": "rec...", "stateId": "rec...", "createdAt": 0, "lastSignInAt": 0 }
  ],
  "totalCount": 123
}
```

`role`, `schoolId`, and `stateId` are read from Clerk `publicMetadata`. This is the only route in the API that returns a `totalCount` and supports real pagination.

### Side effects

None. Read only (reads from Clerk, not Airtable).

---

## `PATCH /api/users/{userId}/role`

Assign a role (and optional school/state) to any user. Admin action.

| | |
|---|---|
| **Auth** | `requirePermission("users:manage")` -> `admin` only |
| **Handler** | `PATCH`, Clerk metadata update + `updateUserRole()` |

### Request

JSON body (all optional, but at least one is expected):

| Field | Notes |
|---|---|
| `role` | Must be one of `admin`, `teacher`, `student`, `parent`, `state_director`. Invalid value returns `400`. |
| `schoolId` | Charter record ID. |
| `stateId` | States record ID. |

The handler reads the user's current `publicMetadata`, merges the provided fields (so other metadata is preserved), and writes it back to Clerk via `updateUserMetadata`.

### Response

```json
{ "success": true, "data": { "userId": "user_...", "role": "teacher", "schoolId": "rec...", "stateId": "rec..." } }
```

### Side effects

- Updates Clerk `publicMetadata` (`role`, `schoolId`, `stateId`).
- If `role` was provided, calls `updateUserRole(userId, role, { schoolId, stateId })`, which finds the Airtable `Users` row by Clerk ID and sets `Role`, `Status = "active"`, and linked `School` / `State`.
- Writes an `Audit Log` row: action `role.assigned`, target type `user`.

!!! warning "Verify: Airtable mirror can silently no-op"
    `updateUserRole` returns early without error if no Airtable `Users` row matches the Clerk ID, and swallows write errors. The route still returns `success: true`. The Clerk metadata is the source of truth; the Airtable row may lag.

---

## `PATCH /api/users/{userId}/team`

Student or parent self-links their own team. One-time.

| | |
|---|---|
| **Auth** | `requireAuth()` plus inline ownership and role checks |
| **Handler** | `PATCH`, Clerk metadata update + `updateUserRole()` |

### Guard logic

1. Must be signed in (`401` otherwise).
2. `authResult.userId` must equal the path `userId`, else `403` ("You can only link your own account").
3. Role must be `student` or `parent`, else `403`.
4. The user's current Clerk `publicMetadata.teamId` must be empty, else `400` ("Team already linked. Contact an admin to change it."). This re-reads live Clerk metadata rather than trusting the session claim.

### Request

JSON body:

| Field | Required | Notes |
|---|---|---|
| `teamId` | yes | Airtable team record ID. `400` if missing. |

### Response

```json
{ "success": true, "data": { "userId": "user_...", "teamId": "rec..." } }
```

### Side effects

- Merges `teamId` into Clerk `publicMetadata`.
- Calls `updateUserRole(userId, role, { teamId })`, mirroring `Team` onto the Airtable `Users` row.
- Writes an `Audit Log` row: action `team.self_linked`, target type `team`.

---

## `PATCH /api/users/{userId}/school`

Teacher self-links their own school. One-time.

| | |
|---|---|
| **Auth** | `requireAuth()` plus inline ownership and role checks |
| **Handler** | `PATCH`, Clerk metadata update + `updateUserRole()` |

### Guard logic

1. Must be signed in (`401` otherwise).
2. `authResult.userId` must equal the path `userId`, else `403`.
3. Role must be `teacher`, else `403` ("Only teachers can self-link a school").
4. `authResult.schoolId` must be empty, else `400` ("School already linked. Contact an admin to change it.").

!!! note "Verify: school check reads the session claim, team check reads live Clerk"
    The school route tests `authResult.schoolId` (from the session token), whereas the team route re-fetches live `publicMetadata.teamId`. If a session token is stale, the school "already linked" guard could behave differently from the team one. Confirm whether this asymmetry is intended.

### Request

JSON body:

| Field | Required | Notes |
|---|---|---|
| `schoolId` | yes | Charter record ID. `400` if missing. |

### Response

```json
{ "success": true, "data": { "userId": "user_...", "schoolId": "rec..." } }
```

### Side effects

- Merges `schoolId` into Clerk `publicMetadata`.
- Calls `updateUserRole(userId, "teacher", { schoolId })`, mirroring `School` onto the Airtable `Users` row.
- Writes an `Audit Log` row: action `school.self_linked`, target type `school`.
