/**
 * POST /api/scoring/calculate
 *
 * Calculate MEAT scores for teams at an event.
 *
 * Request body:
 * {
 *   teams: [{
 *     teamId: string,
 *     teamName: string,
 *     schoolName: string,
 *     state: string,
 *     division: string,
 *     categoryScores: [{
 *       categoryName: string,
 *       judges: [{ judgeId, M, E, A, T }, ...] // 6 judges
 *     }]
 *   }]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     rankedTeams: TeamEventScore[],
 *     metadata: { totalTeams, categories, maxPossible, generatedAt }
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  scoreTeamEvent,
  rankTeams,
  validateJudgeScores,
  type CategoryJudgeScores,
  type TeamEventScore,
} from "@/lib/scoring";

interface TeamInput {
  teamId: string;
  teamName: string;
  schoolName: string;
  state: string;
  division: string;
  categoryScores: CategoryJudgeScores[];
}

interface CalculateRequest {
  teams: TeamInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CalculateRequest = await request.json();

    if (!body.teams || !Array.isArray(body.teams) || body.teams.length === 0) {
      return NextResponse.json(
        { success: false, error: "Request must include a non-empty 'teams' array" },
        { status: 400 }
      );
    }

    // Validate all judge scores first
    const validationErrors: { teamId: string; errors: { field: string; message: string }[] }[] = [];

    for (const team of body.teams) {
      if (!team.teamId || !team.teamName) {
        validationErrors.push({
          teamId: team.teamId || "unknown",
          errors: [{ field: "team", message: "teamId and teamName are required" }],
        });
        continue;
      }

      for (const catScore of team.categoryScores) {
        const errors = validateJudgeScores(catScore);
        if (errors.length > 0) {
          validationErrors.push({
            teamId: team.teamId,
            errors: errors.map((e) => ({
              field: `${catScore.categoryName}.${e.field}`,
              message: e.message,
            })),
          });
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation errors in judge scores",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // Score each team
    const teamScores: TeamEventScore[] = body.teams.map((team) =>
      scoreTeamEvent({
        teamId: team.teamId,
        teamName: team.teamName,
        schoolName: team.schoolName,
        state: team.state,
        division: team.division,
        categoryScores: team.categoryScores,
      })
    );

    // Rank all teams
    const rankedTeams = rankTeams(teamScores);

    // Collect metadata
    const allCategories = [
      ...new Set(rankedTeams.flatMap((t) => t.categories.map((c) => c.categoryName))),
    ];

    return NextResponse.json({
      success: true,
      data: {
        rankedTeams,
        metadata: {
          totalTeams: rankedTeams.length,
          categories: allCategories,
          maxPossible: rankedTeams[0]?.maxPossible || 0,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Scoring calculation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during scoring calculation" },
      { status: 500 }
    );
  }
}
