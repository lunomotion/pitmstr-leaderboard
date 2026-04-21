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

    return NextResponse.json(
      {
        success: true,
        data: leaderboard,
      },
      {
        headers: {
          // Cache at the edge for 10s, allow stale for 30s while revalidating.
          // Keeps judge-submission feedback near-real-time while avoiding
          // Airtable hits on repeated leaderboard views during events.
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
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
