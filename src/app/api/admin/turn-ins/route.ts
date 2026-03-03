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

    // Fetch Turn-Ins — try sorted, fall back to unsorted
    let records;
    try {
      records = await base("Turn-Ins")
        .select({
          sort: [{ field: "Submitted At", direction: "desc" }],
          maxRecords: 200,
        })
        .all();
    } catch {
      records = await base("Turn-Ins")
        .select({ maxRecords: 200 })
        .all();
    }

    // Build lookup caches for linked record names
    const teamIds = new Set<string>();
    const eventIds = new Set<string>();
    const categoryIds = new Set<string>();

    for (const r of records) {
      const tid = getFirstLinked(r.get("Team"));
      const eid = getFirstLinked(r.get("Event"));
      const cid = getFirstLinked(r.get("Category"));
      if (tid) teamIds.add(tid);
      if (eid) eventIds.add(eid);
      if (cid) categoryIds.add(cid);
    }

    // Fetch names in parallel — each wrapped in try/catch
    const [teamNames, eventNames, categoryNames] = await Promise.all([
      safeFetchNames(base, "Teams", "Team Name", teamIds),
      safeFetchNames(base, "Events", "Event Name", eventIds),
      safeFetchNames(base, "Categories", "Category Name", categoryIds),
    ]);

    const data = records.map((r) => {
      const tid = getFirstLinked(r.get("Team"));
      const eid = getFirstLinked(r.get("Event"));
      const cid = getFirstLinked(r.get("Category"));

      return {
        id: r.id,
        teamName: tid ? teamNames.get(tid) || "Unknown" : "Unknown",
        eventName: eid ? eventNames.get(eid) || "Unknown" : "Unknown",
        category:
          (cid ? categoryNames.get(cid) : null) ||
          (r.get("Category Name") as string) ||
          "Unknown",
        judgeId:
          (r.get("Judge ID") as string) ||
          extractJudgeFromNotes(r.get("Notes") as string) ||
          "—",
        scores: {
          M: (r.get("MEAT_M") as number) || 0,
          E: (r.get("MEAT_E") as number) || 0,
          A: (r.get("MEAT_A") as number) || 0,
          T: (r.get("MEAT_T") as number) || 0,
        },
        weightedScore: (r.get("Weighted Score") as number) || 0,
        submittedAt: (r.get("Submitted At") as string) || null,
        notes: (r.get("Notes") as string) || undefined,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching turn-ins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch turn-ins" },
      { status: 500 }
    );
  }
}

function extractJudgeFromNotes(
  notes: string | undefined | null
): string | null {
  if (!notes) return null;
  const match = notes.match(/^(?:Judge:\s*)?(.+?)(?:\s*\||$)/);
  return match ? match[1].trim() : null;
}

function getFirstLinked(field: unknown): string | null {
  if (
    Array.isArray(field) &&
    field.length > 0 &&
    typeof field[0] === "string"
  ) {
    return field[0];
  }
  return null;
}

/**
 * Safely fetch display names for linked records.
 * If the field name is wrong, falls back to fetching all fields and
 * using the first text-like field as the name.
 */
async function safeFetchNames(
  base: Airtable.Base,
  table: string,
  nameField: string,
  ids: Set<string>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.size === 0) return map;

  try {
    // Try with the specific field first
    const records = await base(table).select({ fields: [nameField] }).all();
    for (const r of records) {
      if (ids.has(r.id)) {
        map.set(r.id, (r.get(nameField) as string) || "Unknown");
      }
    }
  } catch {
    // Field name might not exist — fetch without field filter
    try {
      const records = await base(table).select({ maxRecords: 500 }).all();
      for (const r of records) {
        if (ids.has(r.id)) {
          // Try common name field patterns
          const name =
            (r.get(nameField) as string) ||
            (r.get("Name") as string) ||
            (r.get(table.slice(0, -1) + " Name") as string) ||
            r.id;
          map.set(r.id, name);
        }
      }
    } catch (innerErr) {
      console.error(`Failed to fetch names from ${table}:`, innerErr);
    }
  }

  return map;
}
