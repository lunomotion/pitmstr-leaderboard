import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/airtable";
import type { EventStatus, Division } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as EventStatus | null;
    const division = searchParams.get("division") as Division | null;
    const state = searchParams.get("state");
    const limit = searchParams.get("limit");

    const events = await getEvents({
      status: status || undefined,
      division: division || undefined,
      state: state || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}
