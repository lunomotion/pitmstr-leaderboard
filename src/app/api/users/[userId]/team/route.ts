import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAuth, isAuthError } from "@/lib/auth";
import { logAuditEvent, updateUserRole } from "@/lib/airtable";

// Student self-link: set their own teamId (one-time)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult;

    const { userId } = await params;

    // Users can only set their OWN team
    if (authResult.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only link your own account" },
        { status: 403 }
      );
    }

    // Must be a student or parent
    if (authResult.role !== "student" && authResult.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Only students and parents can self-link a team" },
        { status: 403 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Must not already have a team
    if (currentMetadata.teamId) {
      return NextResponse.json(
        {
          success: false,
          error: "Team already linked. Contact an admin to change it.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "teamId is required" },
        { status: 400 }
      );
    }

    // Update Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        teamId,
      },
    });

    // Sync to Airtable
    await updateUserRole(userId, authResult.role, { teamId });

    // Audit log
    await logAuditEvent(userId, "team.self_linked", "team", teamId, {
      email: user.emailAddresses[0]?.emailAddress,
    });

    return NextResponse.json({
      success: true,
      data: { userId, teamId },
    });
  } catch (error) {
    console.error("API Error linking team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link team" },
      { status: 500 }
    );
  }
}
