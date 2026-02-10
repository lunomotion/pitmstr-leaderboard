import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { type Role, hasPermission, type Permission } from "./roles";

// User context extracted from Clerk session
export interface AuthContext {
  userId: string;
  role: Role | undefined;
  schoolId: string | undefined;
  stateId: string | undefined;
}

// Get the current user's auth context (returns null if not signed in)
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

// Guard for API routes — returns context or a NextResponse error
export async function requireAuth(): Promise<
  AuthContext | NextResponse
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return ctx;
}

// Guard that checks both auth AND a specific permission
// Returns the auth context if allowed, or a NextResponse error to return immediately
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

// Type guard to check if the result is an error response
export function isAuthError(
  result: AuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
