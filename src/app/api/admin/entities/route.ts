/**
 * GET /api/admin/entities?table=Judges|Sponsors|Volunteers
 *
 * Generic Airtable table reader for admin pages.
 * Fetches all records and returns field names + data dynamically.
 */

import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";
import { requirePermission, isAuthError } from "@/lib/auth";

const ALLOWED_TABLES = ["Judges", "Sponsors", "Volunteers"];

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error("Airtable not configured");
  }
  return new Airtable({ apiKey }).base(baseId);
}

export async function GET(request: NextRequest) {
  const auth = await requirePermission("admin:access");
  if (isAuthError(auth)) return auth;

  try {
    const table = request.nextUrl.searchParams.get("table");

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid table. Allowed: ${ALLOWED_TABLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const base = getBase();
    const records = await base(table).select({ maxRecords: 500 }).all();

    // Discover field names from the first record
    const fieldNames = new Set<string>();
    for (const r of records) {
      const fields = r.fields;
      for (const key of Object.keys(fields)) {
        fieldNames.add(key);
      }
    }

    // Map records to plain objects
    const data = records.map((r) => {
      const row: Record<string, unknown> = { id: r.id };
      for (const key of fieldNames) {
        const val = r.get(key);
        if (val !== undefined && val !== null) {
          row[key] = val;
        }
      }
      return row;
    });

    return NextResponse.json({
      success: true,
      table,
      fields: Array.from(fieldNames),
      data,
    });
  } catch (error) {
    console.error("Error fetching entities:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch data";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
