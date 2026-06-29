# Clerk Setup

Clerk configuration, session handling, and user metadata.

[Clerk](https://clerk.com) is the identity provider for PITMSTR. It owns the
sign-in / sign-up UI, the session token, and the per-user `publicMetadata` that
carries each user's role. The application never stores passwords or sessions
itself: it trusts the Clerk session and reads a role claim out of it.

## Provider wiring

The whole app is wrapped in Clerk's `<ClerkProvider>` in the root layout,
`src/app/layout.tsx`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
// ...
<ClerkProvider>
  {/* app tree */}
</ClerkProvider>
```

Server-side, route handlers and helpers import from `@clerk/nextjs/server`
(for example `auth()` and `clerkClient()`); the middleware imports
`clerkMiddleware` and `createRouteMatcher` from the same package.

## Sign-in and sign-up routes

Clerk's prebuilt components are mounted on optional catch-all routes so Clerk
can handle its own multi-step flows (verification, MFA, etc.) under a single
path:

| Route | File | Component |
|-------|------|-----------|
| `/sign-in` | `src/app/sign-in/[[...sign-in]]/page.tsx` | `<SignIn />` |
| `/sign-up` | `src/app/sign-up/[[...sign-up]]/page.tsx` | `<SignUp />` |

The sign-in page is intentionally minimal: it just centers Clerk's component.

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--light-grey)]">
      <SignIn />
    </div>
  );
}
```

Both `/sign-in(.*)` and `/sign-up(.*)` are listed as public routes in
`src/middleware.ts`, so anonymous visitors can reach them.

!!! note "`.page.tsx.local` files"
    The `sign-in` and `sign-up` directories also contain `page.tsx.local` files.
    These are not built by Next.js (only `page.tsx` is a route). They are local
    scratch / alternate versions kept alongside the real page. Ignore them when
    reasoning about routing.

!!! warning "Verify: sign-in / sign-up URL env vars"
    The project `CLAUDE.md` documents `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and
    `NEXT_PUBLIC_CLERK_SIGN_UP_URL` as environment variables, but
    `.env.local.example` only ships Airtable keys, and no code in `src/` reads
    those variables directly. Clerk picks them up automatically from the
    environment when present. Set them to `/sign-in` and `/sign-up` so Clerk's
    redirects land on the in-app pages rather than the hosted Clerk pages.

## Session handling

There is no application session store. On the server, the current session is
obtained from Clerk:

```typescript
import { auth } from "@clerk/nextjs/server";

const { userId, sessionClaims } = await auth();
```

`src/lib/auth.ts` wraps this in `getAuthContext()`. If there is no `userId`
the user is anonymous and the helper returns `null`. Otherwise it pulls the
role and scoping fields out of the session claims (see below). See
[Middleware & Route Protection](middleware.md) for how these helpers are used.

## User metadata: roles live in `publicMetadata`

Each user's role and scope are stored in Clerk `publicMetadata`. Three fields
are used:

| Field | Meaning |
|-------|---------|
| `role` | One of the five `Role` values (`admin`, `teacher`, `student`, `parent`, `state_director`). |
| `schoolId` | The school (charter) the user belongs to, for teachers / students. |
| `stateId` | The state a `state_director` is scoped to. |

`publicMetadata` is readable from the client and embedded in the session token,
so it is appropriate for non-secret authorization data like a role. It must
only ever be written server-side using the Clerk backend client.

### Writing metadata

Roles are assigned by an admin through `PATCH /api/users/[userId]/role`
(`src/app/api/users/[userId]/role/route.ts`). That route:

1. Guards with `requirePermission("users:manage")` (admin only).
2. Validates the role against `Object.values(ROLES)`.
3. Reads the existing metadata, merges in the new `role` / `schoolId` /
   `stateId`, and calls `client.users.updateUserMetadata(...)`.
4. Mirrors the role into Airtable via `updateUserRole(...)`.
5. Writes an audit log entry (`role.assigned`).

```typescript
await client.users.updateUserMetadata(userId, {
  publicMetadata: updatedMetadata,
});
```

Teachers can also self-link a school exactly once through
`PATCH /api/users/[userId]/school`, which writes `schoolId` into their own
`publicMetadata` (covered in [Middleware & Route Protection](middleware.md)).

## The session-claim shape: `src/types/clerk.d.ts`

Clerk projects `publicMetadata` into the session token under a `metadata`
claim. The TypeScript shape of that claim is declared globally so that
`sessionClaims.metadata` is strongly typed everywhere:

```typescript
import type { Role } from "@/lib/roles";

export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role;
      schoolId?: string;
      stateId?: string;
    };
  }
}
```

This is the contract that `getAuthContext()` relies on when it reads
`sessionClaims?.metadata`:

```typescript
const metadata = sessionClaims?.metadata as
  | Record<string, unknown>
  | undefined;

return {
  userId,
  role: metadata?.role as Role | undefined,
  schoolId: metadata?.schoolId as string | undefined,
  stateId: metadata?.stateId as string | undefined,
};
```

!!! warning "Verify: the dashboard claim must match this shape"
    `clerk.d.ts` only declares the TypeScript type. The actual `metadata` claim
    must be configured in the Clerk dashboard's session-token template to copy
    `user.public_metadata` into a `metadata` key. The type and the dashboard
    config must stay in sync; the type alone does not create the claim.

## Keeping Airtable in sync: the Clerk webhook

Airtable is the system of record for users, so Clerk pushes user lifecycle
events to `POST /api/webhooks/clerk`
(`src/app/api/webhooks/clerk/route.ts`). This endpoint is public in the
middleware because it is called by Clerk's servers, not by a logged-in user.
It is authenticated by Svix signature verification instead of a session:

```typescript
const wh = new Webhook(WEBHOOK_SECRET);
evt = wh.verify(body, {
  "svix-id": svix_id,
  "svix-timestamp": svix_timestamp,
  "svix-signature": svix_signature,
}) as WebhookEvent;
```

It handles three event types:

| Clerk event | Airtable action |
|-------------|-----------------|
| `user.created` | `createUser(id, email, firstName, lastName)` |
| `user.updated` | `updateUser(id, { email, firstName, lastName })` |
| `user.deleted` | `suspendUser(id)` |

The secret is read from `process.env.CLERK_WEBHOOK_SECRET`. If it is missing
the route returns `500`; if the signature is invalid it returns `400`.

!!! warning "Verify: `CLERK_WEBHOOK_SECRET` env var"
    The webhook reads `process.env.CLERK_WEBHOOK_SECRET`, but this variable is
    not listed in `CLAUDE.md`'s env section and is absent from
    `.env.local.example`. It must be set in the deployment environment (the
    signing secret from the Clerk dashboard webhook config) or user-sync will
    break.

## Clerk environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Browser-side Clerk key (per `CLAUDE.md`). |
| `CLERK_SECRET_KEY` | Server-side Clerk key for `clerkClient()` / `auth()`. |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for the user-sync webhook. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Where Clerk sends users to sign in (`/sign-in`). |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Where Clerk sends users to sign up (`/sign-up`). |

!!! note
    Per `CLAUDE.md`, Clerk is configured for OTP and social login with role
    metadata in `publicMetadata`. The specific enabled sign-in strategies are
    a Clerk dashboard setting and are not expressed in this repository.
