import { NextRequest, NextResponse } from "next/server";
import { searchTeams } from "@/lib/airtable";
import { requirePermission, isAuthError } from "@/lib/auth";
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
    const query = searchParams.get("q") || "";

    // Fetch all teams (or search if query provided)
    const teams = await searchTeams(query || " "); // Pass space to get all teams

    return NextResponse.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch teams",
      },
      { status: 500 }
    );
  }
}

// Create a new team (admin + teacher)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("teams:create");
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { name, schoolId, division, coach, state } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      );
    }

    const base = getBase();

    // Build the fields object
    const fields: Partial<Airtable.FieldSet> = {
      "Team Name": name,
      State: state || "",
    };

    if (coach) fields["Advisor / Coach"] = coach;
    if (schoolId) fields["Charter"] = [schoolId];
    if (division) fields["Division"] = [division];

    const record = await base("Teams").create(fields);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        name: record.get("Team Name"),
        state: record.get("State"),
      },
    });
  } catch (error) {
    console.error("API Error creating team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}

// Delete a team (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePermission("teams:delete");
    if (isAuthError(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("id");

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: "Team ID is required" },
        { status: 400 }
      );
    }

    const base = getBase();
    await base("Teams").destroy(teamId);

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("API Error deleting team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
