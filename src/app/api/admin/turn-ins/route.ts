/**
 * GET /api/admin/turn-ins
 *
 * Fetches Turn-Ins from Airtable — these represent physical box
 * submissions (team turning in food at an event).
 *
 * Airtable fields: Name, Team, Event, Category, Turn-In Time,
 * Box Photo, Notes, Report Cards, Scorecard Count
 */

import { NextResponse } from "next/server";
import Airtable from "airtable";

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Airtable not configured");
  }
  return new Airtable({ apiKey }).base(baseId);
}

export async function GET() {
  try {
    const base = getBase();

    const records = await base("Turn-Ins")
      .select({ maxRecords: 200 })
      .all();

    const data = records.map((r) => {
      const teamName = getFirstLookup(r.get("Team Name"));
      const eventName = getFirstLookup(r.get("Event Name"));
      const categoryDesc = getFirstLookup(r.get("Category Description"));

      return {
        id: r.id,
        name: (r.get("Name") as string) || "",
        teamName: teamName || "Unknown",
        eventName: eventName || "Unknown",
        category: categoryDesc || "Unknown",
        turnInTime: (r.get("Turn-In Time") as string) || null,
        scorecardCount: (r.get("Scorecard Count") as number) || 0,
        notes: (r.get("Notes") as string) || "",
        hasPhoto: Array.isArray(r.get("Box Photo")) && (r.get("Box Photo") as unknown[]).length > 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching turn-ins:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch turn-ins";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

function getFirstLookup(field: unknown): string | null {
  if (Array.isArray(field) && field.length > 0) return String(field[0]);
  if (typeof field === "string") return field;
  return null;
}
