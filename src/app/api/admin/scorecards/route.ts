/**
 * GET /api/admin/scorecards
 *
 * Fetches BBQ Report Cards from Airtable — these are the actual
 * judge score submissions with M.E.A.T. component breakdowns.
 *
 * Airtable fields: Mis En Place (out of 10), Taste (out of 55),
 * Appearance (out of 15), Texture (out of 20), Total Score,
 * Judge, Team, Event, Category (all with lookup fields)
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

    const records = await base("BBQ Report Cards")
      .select({ maxRecords: 500 })
      .all();

    const data = records.map((r) => {
      const M = (r.get("Mis En Place (out of 10)") as number) || 0;
      const E = (r.get("Taste (out of 55)") as number) || 0;
      const A = (r.get("Appearance (out of 15)") as number) || 0;
      const T = (r.get("Texture (out of 20)") as number) || 0;
      const totalScore = (r.get("Total Score") as number) || M + E + A + T;

      return {
        id: r.id,
        name: (r.get("Name") as string) || "",
        teamName: getFirstLookup(r.get("Team Name (Lookup)")) || "Unknown",
        eventName: getFirstLookup(r.get("Event Name (Lookup)")) || "Unknown",
        category: getFirstLookup(r.get("Category Name (Lookup)")) || "Unknown",
        judgeName: getFirstLookup(r.get("Judge Name (Lookup)")) || "—",
        scores: { M, E, A, T },
        totalScore,
        totalPenalty: (r.get("Total Penalty Points") as number) || 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching scorecards:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch scorecards";
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
