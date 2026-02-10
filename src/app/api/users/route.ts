import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission, isAuthError } from "@/lib/auth";

// List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission("users:manage");
    if (isAuthError(authResult)) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const client = await clerkClient();

    const users = query
      ? await client.users.getUserList({
          query,
          limit,
          offset,
        })
      : await client.users.getUserList({
          limit,
          offset,
          orderBy: "-created_at",
        });

    const formatted = users.data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl,
      role: (user.publicMetadata as Record<string, unknown>)?.role || null,
      schoolId:
        (user.publicMetadata as Record<string, unknown>)?.schoolId || null,
      stateId:
        (user.publicMetadata as Record<string, unknown>)?.stateId || null,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      totalCount: users.totalCount,
    });
  } catch (error) {
    console.error("API Error listing users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
