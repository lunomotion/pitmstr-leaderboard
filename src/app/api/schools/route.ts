import { NextRequest, NextResponse } from "next/server";
import { searchSchools } from "@/lib/airtable";

// Public endpoint — list/search all schools (Charter table)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    const schools = await searchSchools(query || " "); // space = return all

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch schools",
      },
      { status: 500 }
    );
  }
}
