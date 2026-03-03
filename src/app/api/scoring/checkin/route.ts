/**
 * POST /api/scoring/checkin
 *
 * Records a team check-in at an event.
 * Called when a team scans the CHECK-IN QR code.
 *
 * Request body: { eventId: string, teamId: string }
 * Response: { success, data: { teamName, eventName, checkedInAt } }
 */

import { NextRequest, NextResponse } from "next/server";
import { getTeam, getEvent } from "@/lib/airtable";
import Airtable from "airtable";

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) throw new Error("Airtable not configured");
  return new Airtable({ apiKey }).base(baseId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, teamId } = body;

    if (!eventId || !teamId) {
      return NextResponse.json(
        { success: false, error: "eventId and teamId are required" },
        { status: 400 }
      );
    }

    // Fetch team and event to validate and get names
    const [team, event] = await Promise.all([
      getTeam(teamId),
      getEvent(eventId),
    ]);

    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Record check-in in Airtable (Turn-Ins table with a "Check-In" type)
    const base = getBase();
    const checkedInAt = new Date().toISOString();

    const checkinFields: Partial<Airtable.FieldSet> = {
      Event: [eventId],
      Team: [teamId],
      Notes: `SYSTEM-CHECKIN | Team check-in at ${checkedInAt}`,
      "Submitted At": checkedInAt,
    };

    try {
      await base("Turn-Ins").create(checkinFields);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "error" in err &&
        (err as { error: string }).error === "UNKNOWN_FIELD_NAME"
      ) {
        // Minimal fallback — just link fields
        await base("Turn-Ins").create({
          Event: [eventId],
          Team: [teamId],
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        teamName: team.name,
        eventName: event.name,
        checkedInAt,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check in" },
      { status: 500 }
    );
  }
}
