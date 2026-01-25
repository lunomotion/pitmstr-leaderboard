import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/airtable";
import type { EventStatus, Division } from "@/lib/types";
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as EventStatus | null;
    const division = searchParams.get("division") as Division | null;
    const state = searchParams.get("state");
    const limit = searchParams.get("limit");

    const events = await getEvents({
      status: status || undefined,
      division: division || undefined,
      state: state || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}

// Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, location, city, state, division, description, categories } = body;

    if (!name || !date) {
      return NextResponse.json(
        { success: false, error: "Event name and date are required" },
        { status: 400 }
      );
    }

    const base = getBase();

    // Build the fields object
    const fields: Partial<Airtable.FieldSet> = {
      "Event Name": name,
      "Event Date": date,
      Location: location || `${city || ""}, ${state || ""}`.trim(),
    };

    if (description) fields["Description"] = description;
    if (division) fields["Division"] = [division];
    if (state) fields["State"] = [state];
    if (categories && categories.length > 0) fields["Category"] = categories;

    const record = await base("Events").create(fields);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        name: record.get("Event Name"),
        date: record.get("Event Date"),
        location: record.get("Location"),
      },
    });
  } catch (error) {
    console.error("API Error creating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Event ID is required" },
        { status: 400 }
      );
    }

    const base = getBase();
    await base("Events").destroy(eventId);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("API Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
