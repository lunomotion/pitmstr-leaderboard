/**
 * POST /api/scoring/submit
 *
 * Saves a single judge's MEAT scores for a team's food category.
 * Called from the QR code judge scoring form (/scan/turnin/...).
 *
 * Writes to the "BBQ Report Cards" table in Airtable.
 *
 * Airtable field names (from Mike's base):
 *   - "Mis En Place (out of 10)"  → 0-10 points
 *   - "Taste (out of 55)"         → 0-55 points
 *   - "Appearance (out of 15)"    → 0-15 points
 *   - "Texture (out of 20)"       → 0-20 points
 *   - "Total Score"               → sum (out of 100)
 *   - "Judge"                     → link to Judges table
 *   - "Team"                      → link to Teams table
 *   - "Event"                     → link to Events table
 *   - "Category"                  → link to Categories table
 *   - "Notes"                     → text
 */

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

interface SubmitScoreRequest {
  eventId: string;
  teamId: string;
  category: string;
  judgeId: string;
  scores: {
    M: number; // Mis En Place: 0-10
    E: number; // Taste (EAT): 0-55
    A: number; // Appearance: 0-15
    T: number; // Texture: 0-20
  };
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitScoreRequest = await request.json();

    // Validate required fields
    if (!body.eventId || !body.teamId || !body.category || !body.judgeId) {
      return NextResponse.json(
        { success: false, error: "eventId, teamId, category, and judgeId are required" },
        { status: 400 }
      );
    }

    if (!body.scores || typeof body.scores !== "object") {
      return NextResponse.json(
        { success: false, error: "scores object with M, E, A, T is required" },
        { status: 400 }
      );
    }

    // Validate score ranges per MEAT system
    const ranges: Record<string, { max: number; label: string }> = {
      M: { max: 10, label: "Mis En Place" },
      E: { max: 55, label: "Taste" },
      A: { max: 15, label: "Appearance" },
      T: { max: 20, label: "Texture" },
    };

    for (const [key, { max, label }] of Object.entries(ranges)) {
      const value = body.scores[key as keyof typeof body.scores];
      if (typeof value !== "number" || isNaN(value) || value < 0 || value > max) {
        return NextResponse.json(
          { success: false, error: `${label} must be 0–${max} (got ${value})` },
          { status: 400 }
        );
      }
    }

    const base = getBase();

    // Look up Category record ID from name
    let categoryRecordId: string | null = null;
    try {
      const catRecords = await base("Categories")
        .select({
          filterByFormula: `LOWER({Category Name}) = LOWER('${body.category.replace(/'/g, "\\'")}')`,
          maxRecords: 1,
        })
        .all();
      if (catRecords.length > 0) {
        categoryRecordId = catRecords[0].id;
      }
    } catch (catErr) {
      console.warn("Category lookup failed:", catErr);
    }

    // Look up Judge record ID from name/ID
    let judgeRecordId: string | null = null;
    try {
      const judgeRecords = await base("Judges")
        .select({
          filterByFormula: `OR(LOWER({Judge Name}) = LOWER('${body.judgeId.replace(/'/g, "\\'")}'), RECORD_ID() = '${body.judgeId}')`,
          maxRecords: 1,
        })
        .all();
      if (judgeRecords.length > 0) {
        judgeRecordId = judgeRecords[0].id;
      }
    } catch (judgeErr) {
      console.warn("Judge lookup failed:", judgeErr);
    }

    // Total is computed by Airtable formula — we just send the components
    const totalScore = body.scores.M + body.scores.E + body.scores.A + body.scores.T;

    // Build the BBQ Report Card record
    const fields: Partial<Airtable.FieldSet> = {
      Event: [body.eventId],
      Team: [body.teamId],
      "Mis En Place (out of 10)": body.scores.M,
      "Taste (out of 55)": body.scores.E,
      "Appearance (out of 15)": body.scores.A,
      "Texture (out of 20)": body.scores.T,
    };

    if (categoryRecordId) {
      fields["Category"] = [categoryRecordId];
    }

    if (judgeRecordId) {
      fields["Judge"] = [judgeRecordId];
    }

    // Note: BBQ Report Cards table has no "Notes" field

    const record = await base("BBQ Report Cards").create(fields);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        totalScore,
        message: "Score submitted successfully",
      },
    });
  } catch (error) {
    console.error("Score submission error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? (error as { message: string }).message
          : "Failed to submit score";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
