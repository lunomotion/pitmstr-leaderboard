import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requirePermission, isAuthError } from "@/lib/auth";
import { logAuditEvent, updateUserRole } from "@/lib/airtable";
import { ROLES, type Role } from "@/lib/roles";

const validRoles = Object.values(ROLES);

// Update a user's role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await requirePermission("users:manage");
    if (isAuthError(authResult)) return authResult;

    const { userId } = await params;
    const body = await request.json();
    const { role, schoolId, stateId } = body;

    // Validate role
    if (role && !validRoles.includes(role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Get current metadata so we don't overwrite other fields
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, unknown>;

    // Build updated metadata
    const updatedMetadata: Record<string, unknown> = {
      ...currentMetadata,
    };

    if (role !== undefined) updatedMetadata.role = role;
    if (schoolId !== undefined) updatedMetadata.schoolId = schoolId;
    if (stateId !== undefined) updatedMetadata.stateId = stateId;

    // Update in Clerk
    await client.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });

    // Sync role to Airtable
    if (role) {
      await updateUserRole(userId, role, { schoolId, stateId });
    }

    // Audit log
    await logAuditEvent(authResult.userId, "role.assigned", "user", userId, {
      role,
      targetEmail: user.emailAddresses[0]?.emailAddress,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        role: updatedMetadata.role,
        schoolId: updatedMetadata.schoolId,
        stateId: updatedMetadata.stateId,
      },
    });
  } catch (error) {
    console.error("API Error updating user role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
