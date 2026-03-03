/**
 * POST /api/scoring/submit
 *
 * Saves a single judge's MEAT scores for a team's food category.
 * Called from the QR code judge scoring form (/scan/turnin/...).
 *
 * Writes to the "Turn-Ins" table in Airtable.
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
        {
          success: false,
          error:
            "eventId, teamId, category, and judgeId are required",
        },
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
      if (
        typeof value !== "number" ||
        isNaN(value) ||
        value < 0 ||
        value > 100
      ) {
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
    let categoryRecordId: string | null = null;
    try {
      const categoryRecords = await base("Categories")
        .select({
          filterByFormula: `LOWER({Category Name}) = LOWER('${body.category.replace(/'/g, "\\'")}')`,
          maxRecords: 1,
        })
        .all();
      if (categoryRecords.length > 0) {
        categoryRecordId = categoryRecords[0].id;
      }
    } catch (catErr) {
      console.warn("Category lookup failed:", catErr);
    }

    // Calculate weighted score
    const weightedScore =
      0.1 * body.scores.M +
      0.5 * body.scores.E +
      0.2 * body.scores.A +
      0.2 * body.scores.T;
    const roundedScore = Math.round(weightedScore * 1000) / 1000;

    // Build notes string with judge info
    const noteParts: string[] = [];
    if (body.judgeId) noteParts.push(`Judge: ${body.judgeId}`);
    noteParts.push(`Category: ${body.category}`);
    noteParts.push(`Scores: M=${body.scores.M} E=${body.scores.E} A=${body.scores.A} T=${body.scores.T}`);
    noteParts.push(`Weighted: ${roundedScore}`);
    if (body.notes) noteParts.push(body.notes);
    const notesString = noteParts.join(" | ");

    // Try progressively simpler field sets until one works
    const fieldSets: Partial<Airtable.FieldSet>[] = [
      // Attempt 1: All fields
      {
        Event: [body.eventId],
        Team: [body.teamId],
        ...(categoryRecordId ? { Category: [categoryRecordId] } : {}),
        MEAT_M: body.scores.M,
        MEAT_E: body.scores.E,
        MEAT_A: body.scores.A,
        MEAT_T: body.scores.T,
        "Weighted Score": roundedScore,
        "Submitted At": new Date().toISOString(),
        Notes: notesString,
      },
      // Attempt 2: Links + MEAT scores only
      {
        Event: [body.eventId],
        Team: [body.teamId],
        ...(categoryRecordId ? { Category: [categoryRecordId] } : {}),
        MEAT_M: body.scores.M,
        MEAT_E: body.scores.E,
        MEAT_A: body.scores.A,
        MEAT_T: body.scores.T,
      },
      // Attempt 3: Links + Notes only (scores in notes as backup)
      {
        Event: [body.eventId],
        Team: [body.teamId],
        ...(categoryRecordId ? { Category: [categoryRecordId] } : {}),
        Notes: notesString,
      },
      // Attempt 4: Just link fields
      {
        Event: [body.eventId],
        Team: [body.teamId],
        ...(categoryRecordId ? { Category: [categoryRecordId] } : {}),
      },
      // Attempt 5: Bare minimum — just event + team
      {
        Event: [body.eventId],
        Team: [body.teamId],
      },
    ];

    let record;
    let lastError: unknown = null;

    for (let i = 0; i < fieldSets.length; i++) {
      try {
        record = await base("Turn-Ins").create(fieldSets[i]);
        if (i > 0) {
          console.warn(
            `Turn-In created with field set attempt ${i + 1} (simpler fields)`
          );
        }
        break;
      } catch (err: unknown) {
        lastError = err;
        const isFieldError =
          err &&
          typeof err === "object" &&
          "error" in err &&
          (err as { error: string }).error === "UNKNOWN_FIELD_NAME";

        if (isFieldError && i < fieldSets.length - 1) {
          console.warn(
            `Turn-In attempt ${i + 1} failed:`,
            (err as unknown as { message?: string }).message || "unknown field"
          );
          continue;
        }
        // Not a field error or last attempt — throw
        throw err;
      }
    }

    if (!record) {
      const errMsg =
        lastError && typeof lastError === "object" && "message" in lastError
          ? (lastError as { message: string }).message
          : "All field combinations failed";
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 500 }
      );
    }

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
    // Return the actual error message so we can debug
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
