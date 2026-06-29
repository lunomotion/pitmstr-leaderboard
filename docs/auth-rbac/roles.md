# Roles & Permissions

The role model and the full permission matrix.

Everything on this page is derived from `src/lib/roles.ts`, which is the single
source of truth for roles and what each role can do. If you change access
rules, change them there.

## The five roles

Roles are defined in the `ROLES` constant and typed as `Role`:

```typescript
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  STATE_DIRECTOR: "state_director",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
```

Human-readable labels come from `ROLE_LABELS`:

| Role value | Label (`ROLE_LABELS`) | Who it is |
|------------|-----------------------|-----------|
| `admin` | NHSBBQA Admin | Mike's organization. Super user, full access. |
| `teacher` | Teacher / School Admin | Manages their own school and its teams. |
| `student` | Student | Linked account, views own data. |
| `parent` | Parent | Linked account, views own (child's) data. |
| `state_director` | State Director | State-level visibility and reporting. |

!!! note "Public is not a role"
    Unauthenticated visitors have no role at all (`role` is `undefined`).
    `hasPermission(undefined, ...)` always returns `false`. Public access is
    granted purely by the middleware's public-route list, not by the permission
    matrix. See [Middleware & Route Protection](middleware.md).

## How permissions are evaluated

Permissions are named strings (for example `events:create`). Each one maps to
the list of roles allowed to perform it, in the `PERMISSIONS` object. Two
helpers read this map:

```typescript
export function hasPermission(
  role: Role | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function hasRole(
  role: Role | undefined | null,
  allowed: Role[]
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
```

- `hasPermission` is the primary check and is what `requirePermission` in
  `src/lib/auth.ts` calls.
- `hasRole` is a simpler "is this role in this list" check, available for ad-hoc
  use.
- There is **no role hierarchy or inheritance**. `admin` is not automatically
  granted a permission; it is allowed only where `admin` is explicitly listed
  in `PERMISSIONS`. In practice `admin` is listed on nearly every permission.

## Complete permission matrix

The table below is a one-to-one transcription of the `PERMISSIONS` object.
A check mark means that role is in the allow-list for that permission.

| Permission | Admin | Teacher | Student | Parent | State Director |
|------------|:-----:|:-------:|:-------:|:------:|:--------------:|
| `events:create` | yes | - | - | - | - |
| `events:edit` | yes | - | - | - | - |
| `events:delete` | yes | - | - | - | - |
| `events:view` | yes | yes | yes | yes | yes |
| `teams:create` | yes | yes | - | - | - |
| `teams:edit` | yes | yes | - | - | - |
| `teams:delete` | yes | - | - | - | - |
| `teams:view` | yes | yes | yes | yes | yes |
| `schools:activate` | yes | - | - | - | - |
| `schools:request` | - | yes | - | - | - |
| `schools:view` | yes | yes | - | - | yes |
| `users:manage` | yes | - | - | - | - |
| `users:view_all` | yes | - | - | - | - |
| `users:view_school` | yes | yes | - | - | - |
| `reports:all` | yes | - | - | - | - |
| `reports:school` | yes | yes | - | - | - |
| `reports:own` | yes | yes | yes | yes | - |
| `reports:state` | yes | - | - | - | yes |
| `audit:view` | yes | - | - | - | - |
| `admin:access` | yes | - | - | - | - |

### Notes on specific permissions

- `schools:request` is the **only** permission where `admin` is not in the
  allow-list. It models a teacher requesting a new school / charter; an admin
  acts via `schools:activate` instead.
- `admin:access` is the catch-all gate for every `/api/admin/*` route. It is
  admin-only and is the most commonly used guard in the codebase.
- `reports:own` excludes `state_director`; state directors use `reports:state`
  instead.
- `users:view_school` lets a teacher see users within their own school; the
  actual scoping to the teacher's `schoolId` is the route's responsibility, not
  the permission's.

## What each role can do, in plain terms

=== "Admin (NHSBBQA Admin)"
    Full control. Creates, edits, and deletes events and teams; activates
    schools; manages all users and roles; views all users, all reports, state
    reports, and the audit log; and reaches every admin API via `admin:access`.

=== "Teacher (School Admin)"
    Manages their school's competition presence: creates and edits teams (but
    cannot delete them), requests a new school, views their school's schools /
    users / reports, and views events and teams. Can view their own reports.
    Cannot manage users or reach admin-only APIs.

=== "Student"
    Read-mostly participant: views events and teams, and views their own
    reports (`reports:own`). No create / edit / delete and no school or user
    visibility.

=== "Parent"
    Same shape as a student: views events and teams and their own (child's)
    reports. No management capabilities.

=== "State Director"
    State-level oversight: views events, teams, and schools, and runs state
    reports (`reports:state`). Notably **not** granted `reports:own`, and has
    no create / edit / delete or user-management rights.

## Scope fields: `schoolId` and `stateId`

The permission matrix answers "can this role do this action type". It does
**not** by itself restrict a teacher to their own school or a state director to
their own state. That row-level scoping comes from the `schoolId` / `stateId`
fields on the `AuthContext` and must be applied inside each route handler. The
permission grants the capability; the scope fields constrain the data.

!!! warning "Verify: scope enforcement is per-route"
    Because scoping lives in route handlers rather than in `roles.ts`, audit any
    new route that serves school- or state-specific data to confirm it actually
    filters on `ctx.schoolId` / `ctx.stateId`. A correct permission check alone
    does not prevent a teacher from reading another school's data if the query
    is not scoped.
