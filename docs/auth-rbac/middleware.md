# Middleware & Route Protection

How `src/middleware.ts` and helpers gate routes and APIs.

Protection happens in two places that work together: the edge middleware
decides whether a request needs a logged-in user at all, and the per-route
guards in `src/lib/auth.ts` decide whether that user has the right role.

## The middleware: `src/middleware.ts`

The middleware runs Clerk on every matched request. Its logic is deliberately
small:

```typescript
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Not a public route - user must be signed in
    await auth.protect();
  }
});
```

If the request path is **not** in the public list, `auth.protect()` is called.
For a browser request that redirects an anonymous user to sign-in; for an API
request it produces a `404`/`401`-style rejection. If the path **is** public,
the middleware does nothing and the request proceeds anonymously.

!!! danger "The middleware never checks roles"
    `auth.protect()` only enforces "is signed in." Role enforcement is entirely
    the job of the route guards described below. Any non-public page is reachable
    by **any** signed-in user regardless of role; the API calls behind it are
    what actually enforce admin / teacher / etc.

### Public routes (no login required)

`isPublicRoute` is built with Clerk's `createRouteMatcher`. The `(.*)` suffix
makes a prefix match. These are the public entries, grouped by purpose:

| Pattern | Why it is public |
|---------|------------------|
| `/` | Public landing page. |
| `/sign-in(.*)`, `/sign-up(.*)` | Auth pages themselves. |
| `/leaderboard(.*)` | Public leaderboard. |
| `/events(.*)`, `/teams(.*)`, `/schools(.*)` | Public listing pages. |
| `/knowledge-base(.*)` | Public resources. |
| `/scan(.*)` | QR scan routes. Judges score via QR without logging in. |
| `/pay(.*)` | Public invoice payment pages. |
| `/api/billing/checkout` | Creates a Stripe Checkout session for a public payer. |
| `/api/events(.*)`, `/api/leaderboard(.*)`, `/api/stats(.*)`, `/api/teams(.*)`, `/api/schools(.*)` | Read-only public data APIs. |
| `/api/scoring(.*)` | Judge score submission and check-in via QR, no login. |
| `/api/webhooks/clerk` | Called by Clerk servers; verified by Svix signature. |
| `/api/webhooks/stripe` | Called by Stripe servers; verified by Stripe signature. |

Everything not matching one of these is protected: notably `/admin(.*)`,
`/dashboard(.*)`, and the non-public API routes such as `/api/admin/*`,
`/api/users/*`, `/api/students`, and `/api/reports/*`.

### The matcher config

```typescript
export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

This runs the middleware on all application and API routes while skipping
`_next` internals and static asset file extensions. The negative lookahead
`js(?!on)` deliberately lets `.json` requests through to the middleware while
skipping `.js`.

## The route guards: `src/lib/auth.ts`

Public-but-data APIs and protected APIs both pass through the middleware, but
the middleware cannot express "admin only." That is done inside each route
handler with one of three helpers.

### `getAuthContext()`

Reads the Clerk session and returns the typed context, or `null` if anonymous.

```typescript
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const metadata = sessionClaims?.metadata as
    | Record<string, unknown>
    | undefined;

  return {
    userId,
    role: metadata?.role as Role | undefined,
    schoolId: metadata?.schoolId as string | undefined,
    stateId: metadata?.stateId as string | undefined,
  };
}
```

### `requireAuth()`

Authentication only. Returns the `AuthContext`, or a `401 Unauthorized`
`NextResponse` if the user is not signed in.

```typescript
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return ctx;
}
```

### `requirePermission(permission)`

Authentication **and** authorization. Runs `requireAuth`, then checks the role
against the matrix in `src/lib/roles.ts`. Returns the context, a `401` if not
signed in, or a `403 Forbidden` if the role lacks the permission.

```typescript
export async function requirePermission(
  permission: Permission
): Promise<AuthContext | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (!hasPermission(result.role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}
```

### The calling convention

These helpers return a union of `AuthContext | NextResponse`. The route uses the
`isAuthError` type guard to bail early on failure, then treats the value as the
context:

```typescript
const auth = await requirePermission("admin:access");
if (isAuthError(auth)) return auth; // returns the 401/403 response
// ...auth is now AuthContext: auth.userId, auth.role, auth.schoolId
```

`isAuthError` is simply `result instanceof NextResponse`.

## What happens on failure

| Situation | Where caught | Result |
|-----------|--------------|--------|
| Anonymous user hits a non-public **page** | middleware `auth.protect()` | Redirect to sign-in. |
| Anonymous user hits a protected **API** | middleware `auth.protect()` | Rejected before the handler runs. |
| Signed-in user hits a guarded route they may use | `requireAuth` / `requirePermission` | Handler proceeds with `AuthContext`. |
| Signed-in user, missing role for the action | `requirePermission` | `403 Forbidden` JSON. |
| Signed-in user, but route only needs auth | `requireAuth` | `401` only if somehow not signed in. |

## Which routes enforce what

The following API routes call a guard. This is the live picture from the route
handlers.

| Route + method | Guard |
|----------------|-------|
| `POST /api/users` | `requirePermission("users:manage")` |
| `PATCH /api/users/[userId]/role` | `requirePermission("users:manage")` |
| `PATCH /api/users/[userId]/school` | `requireAuth()` + inline self + teacher checks |
| `PATCH /api/users/[userId]/team` | `requireAuth()` + inline checks |
| `GET /api/students` | `requirePermission("users:view_all")` |
| `POST /api/teams` | `requirePermission("admin:access")` |
| `POST /api/events` | `requirePermission("events:create")` |
| `DELETE /api/events` | `requirePermission("events:delete")` |
| `GET /api/admin/entities` | `requirePermission("admin:access")` |
| `/api/admin/invoices` (GET/POST/PATCH) | `requirePermission("admin:access")` |
| `/api/admin/lookups` | `requirePermission("admin:access")` |
| `/api/admin/scorecards` | `requirePermission("admin:access")` |
| `/api/admin/turn-ins` | `requirePermission("admin:access")` |
| `/api/admin/vendor-documents` | `requirePermission("admin:access")` |
| `/api/reports/invoice` | `requirePermission("admin:access")` |
| `/api/reports/event-results` | `requirePermission("admin:access")` |
| `/api/reports/payment-package` | `requirePermission("admin:access")` |
| `/api/reports/qr-sheet` | `requirePermission("admin:access")` |
| `/api/reports/qr-sheet-batch` | `requirePermission("admin:access")` |

### Self-service guard pattern

`PATCH /api/users/[userId]/school` and `.../team` only call `requireAuth()`
(any signed-in user), then add their own inline checks rather than relying on
the permission matrix. The school route, for example, enforces three things by
hand:

```typescript
// Users can only set their OWN school
if (authResult.userId !== userId) {
  return NextResponse.json(
    { success: false, error: "You can only link your own account" },
    { status: 403 }
  );
}
// Must be a teacher
if (authResult.role !== "teacher") { /* 403 */ }
// Must not already have a school
if (authResult.schoolId) { /* 400 */ }
```

This is a deliberate "self-link, one time" pattern: a teacher can attach their
own `schoolId` once, after which only an admin can change it via the role route.

## Deliberately public data routes (no guard)

Several routes are in the middleware public list **and** have no guard in the
handler. These are intentional, but a developer taking over should understand
the trade-off.

| Route + method | Behavior | Why open |
|----------------|----------|----------|
| `GET /api/events` | Lists events. | Public event listings. Cached `s-maxage=60`. |
| `GET /api/teams` | Lists / searches teams. | Public team pages. |
| `GET /api/schools`, `GET /api/schools/[schoolId]` | School data. | Public school pages. |
| `GET /api/leaderboard`, `GET /api/stats` | Read-only standings / stats. | Public leaderboard. |
| `POST /api/scoring/submit` | Writes a judge's MEAT score to Airtable. | Judges score via QR with no login. |
| `POST /api/scoring/checkin` | Records a team check-in. | Team scans a QR with no login. |
| `POST /api/scoring/calculate` | Computes scores. | Part of the open scoring flow. |
| `POST /api/billing/checkout` | Creates a Stripe Checkout session. | Public payers (parents, sponsors). |
| `POST /api/webhooks/clerk`, `POST /api/webhooks/stripe` | Inbound webhooks. | Authenticated by signature, not session. |

!!! warning "Verify: scoring write endpoints are unauthenticated by design"
    `POST /api/scoring/submit`, `/api/scoring/checkin`, and
    `/api/scoring/calculate` accept writes with **no auth check** because the
    judge-via-QR flow has no login. `submit` mitigates abuse with strict input
    validation (`RECORD_ID_RE`, `SAFE_NAME_RE`, MEAT score-range checks) to
    prevent Airtable formula injection, but anyone who can reach the URL can
    post a score. If unauthenticated scoring is ever deemed too open, add a
    signed/QR-scoped token check here. Confirm this matches Mike's intended
    judging model before changing it.

!!! warning "Verify: public team data and FERPA"
    `GET /api/teams` and `GET /api/schools` are public and unscoped. Given the
    FERPA requirement in `CLAUDE.md`, confirm these responses do not expose
    student personally identifiable information. The student-specific endpoint
    `GET /api/students` is correctly gated behind `users:view_all` (admin only),
    but verify team / school payloads do not leak the same data through a public
    door.
