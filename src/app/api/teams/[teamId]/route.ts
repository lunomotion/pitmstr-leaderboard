import { NextRequest, NextResponse } from "next/server";
import { getTeam, getTeamMembers, getSchool } from "@/lib/airtable";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Fetch team details
    const team = await getTeam(teamId);

    if (!team) {
      return NextResponse.json(
        {
          success: false,
          error: "Team not found",
        },
        { status: 404 }
      );
    }

    // Fetch team members
    let members: Awaited<ReturnType<typeof getTeamMembers>> = [];
    try {
      members = await getTeamMembers(teamId);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }

    // Fetch school details if schoolId exists
    let school: Awaited<ReturnType<typeof getSchool>> | null = null;
    if (team.schoolId) {
      try {
        school = await getSchool(team.schoolId);
      } catch (err) {
        console.error("Error fetching school:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        team,
        members,
        school,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team",
      },
      { status: 500 }
    );
  }
}
