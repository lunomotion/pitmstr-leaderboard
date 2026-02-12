import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAuth, isAuthError } from "@/lib/auth";
import { logAuditEvent, updateUserRole } from "@/lib/airtable";

// Teacher self-link: set their own schoolId (one-time)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult;

    const { userId } = await params;

    // Users can only set their OWN school
    if (authResult.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only link your own account" },
        { status: 403 }
      );
    }

    // Must be a teacher
    if (authResult.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Only teachers can self-link a school" },
        { status: 403 }
      );
    }

    // Must not already have a school
    if (authResult.schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: "School already linked. Contact an admin to change it.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { schoolId } = body;

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: "schoolId is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Get current metadata so we don't overwrite other fields
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Update Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        schoolId,
      },
    });

    // Sync to Airtable
    await updateUserRole(userId, "teacher", { schoolId });

    // Audit log
    await logAuditEvent(userId, "school.self_linked", "school", schoolId, {
      email: user.emailAddresses[0]?.emailAddress,
    });

    return NextResponse.json({
      success: true,
      data: { userId, schoolId },
    });
  } catch (error) {
    console.error("API Error linking school:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link school" },
      { status: 500 }
    );
  }
}
