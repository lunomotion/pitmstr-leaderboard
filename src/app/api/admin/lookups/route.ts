import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Airtable not configured");
  }
  return new Airtable({ apiKey }).base(baseId);
}

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get("table");

  if (!table || !["states", "divisions", "categories"].includes(table)) {
    return NextResponse.json(
      { success: false, error: "Invalid table parameter" },
      { status: 400 }
    );
  }

  try {
    const base = getBase();

    if (table === "states") {
      const records = await base("States").select().all();
      const data = records.map((r) => ({
        id: r.id,
        name: (r.get("State Name") as string) || "",
        abbreviation: (r.get("Abbreviation") as string) || "",
      }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json({ success: true, data });
    }

    if (table === "divisions") {
      const records = await base("Divisions").select().all();
      const data = records.map((r) => ({
        id: r.id,
        name: (r.get("Division Name") as string) || "",
        code: (r.get("Code") as string) || "",
        gradeRange: (r.get("Grade Range") as string) || "",
        ageRange: (r.get("Age Range") as string) || "",
      }));
      return NextResponse.json({ success: true, data });
    }

    if (table === "categories") {
      const records = await base("Categories").select().all();
      const data = records.map((r) => ({
        id: r.id,
        name: (r.get("Category Name") as string) || "",
      }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch ${table}` },
      { status: 500 }
    );
  }
}
