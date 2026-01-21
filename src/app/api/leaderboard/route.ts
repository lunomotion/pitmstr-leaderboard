import { NextRequest, NextResponse } from "next/server";
import { getEventLeaderboard } from "@/lib/airtable";
import type { Category } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    const category = (searchParams.get("category") || "Overall") as Category;

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: "Event ID is required",
        },
        { status: 400 }
      );
    }

    const leaderboard = await getEventLeaderboard(eventId, category);

    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch leaderboard",
      },
      { status: 500 }
    );
  }
}
