import { NextResponse } from "next/server";
import Airtable from "airtable";

// Lazy initialization of Airtable base
let _base: Airtable.Base | null = null;

function getBase(): Airtable.Base {
  if (_base) return _base;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("Airtable credentials not configured");
  }

  _base = new Airtable({ apiKey }).base(baseId);
  return _base;
}

export async function GET() {
  try {
    const base = getBase();

    // Fetch counts from each table in parallel
    const [eventsRecords, teamsRecords, chartersRecords] = await Promise.all([
      base("Events").select({ fields: [] }).all(),
      base("Teams").select({ fields: ["State"] }).all(),
      base("Charter").select({ fields: [] }).all(),
    ]);

    // Count unique states from teams that actually have teams registered
    const uniqueStates = new Set<string>();
    teamsRecords.forEach((record) => {
      const state = record.get("State") as string;
      if (state) {
        uniqueStates.add(state);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        events: eventsRecords.length,
        teams: teamsRecords.length,
        schools: chartersRecords.length,
        states: uniqueStates.size,
      },
    });
  } catch (error) {
    console.error("API Error fetching stats:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch stats",
      data: {
        events: 0,
        teams: 0,
        schools: 0,
        states: 0,
      },
    });
  }
}
