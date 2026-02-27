/**
 * POST /api/scoring/submit
 *
 * Saves a single judge's MEAT scores for a team's food category.
 * Called from the QR code judge scoring form (/scan/turnin/...).
 *
 * Writes to the "Turn-Ins" table in Airtable.
 *
 * Request body:
 * {
 *   eventId: string,
 *   teamId: string,
 *   category: string,
 *   judgeId: string,
 *   scores: { M: number, E: number, A: number, T: number },
 *   notes?: string
 * }
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
    M: number;
    E: number;
    A: number;
    T: number;
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

    // Validate score ranges
    for (const component of ["M", "E", "A", "T"] as const) {
      const value = body.scores[component];
      if (typeof value !== "number" || isNaN(value) || value < 0 || value > 100) {
        return NextResponse.json(
          {
            success: false,
            error: `${component} score must be a number between 0 and 100 (got ${value})`,
          },
          { status: 400 }
        );
      }
    }

    const base = getBase();

    // Look up the Category record ID from name
    const categoryRecords = await base("Categories")
      .select({
        filterByFormula: `LOWER({Category Name}) = LOWER('${body.category.replace(/'/g, "\\'")}')`,
        maxRecords: 1,
      })
      .all();

    // Build the Turn-In record
    // Calculate weighted score for convenience
    const weightedScore =
      0.10 * body.scores.M +
      0.50 * body.scores.E +
      0.20 * body.scores.A +
      0.20 * body.scores.T;
    const roundedScore = Math.round(weightedScore * 1000) / 1000;

    const fields: Partial<Airtable.FieldSet> = {
      Event: [body.eventId],
      Team: [body.teamId],
      "Judge ID": body.judgeId,
      MEAT_M: body.scores.M,
      MEAT_E: body.scores.E,
      MEAT_A: body.scores.A,
      MEAT_T: body.scores.T,
      "Submitted At": new Date().toISOString(),
      "Weighted Score": roundedScore,
    };

    // Link category if we found it
    if (categoryRecords.length > 0) {
      fields["Category"] = [categoryRecords[0].id];
    } else {
      // Store as text fallback
      fields["Category Name"] = body.category;
    }

    if (body.notes) {
      fields["Notes"] = body.notes;
    }

    const record = await base("Turn-Ins").create(fields);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        weightedScore: roundedScore,
        message: "Score submitted successfully",
      },
    });
  } catch (error) {
    console.error("Score submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
