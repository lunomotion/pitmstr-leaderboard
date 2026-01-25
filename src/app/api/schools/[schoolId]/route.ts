import { NextRequest, NextResponse } from "next/server";
import { getSchool, getTeam } from "@/lib/airtable";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Fetch school details
    const school = await getSchool(schoolId);

    if (!school) {
      return NextResponse.json(
        {
          success: false,
          error: "School not found",
        },
        { status: 404 }
      );
    }

    // Fetch teams for this school
    const teams = [];
    if (school.teams && school.teams.length > 0) {
      for (const teamId of school.teams) {
        try {
          const team = await getTeam(teamId);
          if (team) {
            teams.push(team);
          }
        } catch (err) {
          console.error(`Error fetching team ${teamId}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        school,
        teams,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch school",
      },
      { status: 500 }
    );
  }
}
