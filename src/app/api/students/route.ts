import { NextRequest, NextResponse } from "next/server";
import { searchStudents } from "@/lib/airtable";
import { requirePermission, isAuthError } from "@/lib/auth";

// Admin only — list/search all students
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission("users:view_all");
    if (isAuthError(authResult)) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    const students = await searchStudents(query || " "); // space = return all

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch students",
      },
      { status: 500 }
    );
  }
}
