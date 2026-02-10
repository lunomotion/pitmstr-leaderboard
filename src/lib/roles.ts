// ============================================================
// PITMSTR Role-Based Access Control (RBAC)
// ============================================================
// Roles are stored in Clerk publicMetadata and mirrored in Airtable.
// Session token includes metadata via custom claims config.
// ============================================================

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  STATE_DIRECTOR: "state_director",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "NHSBBQA Admin",
  teacher: "Teacher / School Admin",
  student: "Student",
  parent: "Parent",
  state_director: "State Director",
};

// Which roles can perform each action
const PERMISSIONS = {
  // Events
  "events:create": ["admin"],
  "events:edit": ["admin"],
  "events:delete": ["admin"],
  "events:view": ["admin", "teacher", "student", "parent", "state_director"],

  // Teams
  "teams:create": ["admin", "teacher"],
  "teams:edit": ["admin", "teacher"],
  "teams:delete": ["admin"],
  "teams:view": ["admin", "teacher", "student", "parent", "state_director"],

  // Schools / Charters
  "schools:activate": ["admin"],
  "schools:request": ["teacher"],
  "schools:view": ["admin", "teacher", "state_director"],

  // Users
  "users:manage": ["admin"],
  "users:view_all": ["admin"],
  "users:view_school": ["admin", "teacher"],

  // Reports
  "reports:all": ["admin"],
  "reports:school": ["admin", "teacher"],
  "reports:own": ["admin", "teacher", "student", "parent"],
  "reports:state": ["admin", "state_director"],

  // Audit
  "audit:view": ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

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
