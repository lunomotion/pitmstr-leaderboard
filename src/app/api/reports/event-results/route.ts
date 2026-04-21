/**
 * GET /api/reports/event-results?eventId=...&teamsPerPage=10&topN=0
 *
 * Generates an Event Results Report PDF with full MEAT scoring breakdown.
 *
 * Query params:
 *   eventId       - Airtable event record ID (required)
 *   teamsPerPage  - Teams per page: 5, 10, or 25 (default: 10)
 *   topN          - Only show top N teams, 0 = all (default: 0)
 *
 * Returns: PDF file (application/pdf)
 *
 * Note: This endpoint currently generates a report from existing leaderboard data.
 * When full MEAT scoring is wired to Airtable judge scores, this will use the
 * scoring engine to calculate from raw judge data.
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import Airtable from "airtable";
import { EventReport } from "@/lib/pdf/event-report";
import { getEvent, getEventLeaderboard } from "@/lib/airtable";
import { requirePermission, isAuthError } from "@/lib/auth";
import type { TeamEventScore, CategoryResult } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const auth = await requirePermission("admin:access");
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const teamsPerPage = parseInt(searchParams.get("teamsPerPage") || "10", 10);
    const topN = parseInt(searchParams.get("topN") || "0", 10);

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    // Validate teamsPerPage
    const validPerPage = [5, 10, 25];
    const perPage = validPerPage.includes(teamsPerPage) ? teamsPerPage : 10;

    // Fetch event
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: `Event not found: ${eventId}` },
        { status: 404 }
      );
    }

    // Fetch leaderboard data
    const leaderboard = await getEventLeaderboard(eventId, "Overall");

    // Fetch raw Turn-In scores to get MEAT component breakdowns
    const meatComponents = await fetchTurnInComponents(eventId);

    // Convert leaderboard entries to TeamEventScore format for the PDF
    const teamScores: TeamEventScore[] = leaderboard.map((entry) => {
      const teamMeat = meatComponents.get(entry.teamId);

      const categories: CategoryResult[] = Object.entries(
        entry.categoryScores
      ).map(([catName, catData]) => {
        // Look up MEAT components for this team + category
        const catMeat = teamMeat?.get(catName);
        return {
          categoryName: catName,
          components: catMeat || { M: 0, E: 0, A: 0, T: 0 },
          score: catData?.score ?? 0,
        };
      });

      return {
        teamId: entry.teamId,
        teamName: entry.teamName,
        schoolName: entry.schoolName,
        state: entry.state,
        division: entry.division,
        categories,
        eventTotal: entry.score,
        maxPossible: categories.length * 100,
        tieBreakIndex: 0,
        rank: entry.rank,
      };
    });

    // Build logo URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const logoSrc = `${baseUrl}/images/nhsbbqa-logo.png`;

    // Format date
    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    // Render PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(EventReport, {
        eventName: event.name,
        eventDate,
        location: event.location || "",
        division: event.division,
        state: event.state || "",
        teams: teamScores,
        teamsPerPage: perPage,
        topN: topN > 0 ? topN : undefined,
        logoSrc,
      }) as any
    );

    const filename = `Event_Report_${event.name.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Event report generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate event report PDF" },
      { status: 500 }
    );
  }
}

/**
 * Fetch MEAT component averages from Turn-Ins table for all teams at an event.
 * Returns: Map<teamId, Map<categoryName, { M, E, A, T }>>
 */
async function fetchTurnInComponents(
  eventId: string
): Promise<Map<string, Map<string, { M: number; E: number; A: number; T: number }>>> {
  const result = new Map<
    string,
    Map<string, { M: number; E: number; A: number; T: number }>
  >();

  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) return result;

    const base = new Airtable({ apiKey }).base(baseId);

    // Fetch all turn-ins for this event
    const turnIns = await base("Turn-Ins").select({ maxRecords: 1000 }).all();

    // Build category name lookup
    const catRecords = await base("Categories")
      .select({ fields: ["Category Name"] })
      .all();
    const catNames = new Map<string, string>();
    for (const r of catRecords) {
      catNames.set(r.id, (r.get("Category Name") as string) || "Unknown");
    }

    // Group scores by team + category, then average
    const grouped = new Map<
      string,
      Map<string, { M: number[]; E: number[]; A: number[]; T: number[] }>
    >();

    for (const ti of turnIns) {
      const eventIds = getLinkedArr(ti.get("Event"));
      if (!eventIds.includes(eventId)) continue;

      const teamId = getLinkedArr(ti.get("Team"))[0];
      if (!teamId) continue;

      const catId = getLinkedArr(ti.get("Category"))[0];
      const catName = catId
        ? catNames.get(catId) || "Unknown"
        : (ti.get("Category Name") as string) || "Unknown";

      if (!grouped.has(teamId)) grouped.set(teamId, new Map());
      const teamMap = grouped.get(teamId)!;

      if (!teamMap.has(catName)) {
        teamMap.set(catName, { M: [], E: [], A: [], T: [] });
      }
      const scores = teamMap.get(catName)!;

      scores.M.push((ti.get("MEAT_M") as number) || 0);
      scores.E.push((ti.get("MEAT_E") as number) || 0);
      scores.A.push((ti.get("MEAT_A") as number) || 0);
      scores.T.push((ti.get("MEAT_T") as number) || 0);
    }

    // Average the scores
    for (const [teamId, catMap] of grouped) {
      const avgMap = new Map<
        string,
        { M: number; E: number; A: number; T: number }
      >();
      for (const [catName, scores] of catMap) {
        avgMap.set(catName, {
          M: avg(scores.M),
          E: avg(scores.E),
          A: avg(scores.A),
          T: avg(scores.T),
        });
      }
      result.set(teamId, avgMap);
    }
  } catch (error) {
    console.error("Error fetching turn-in components:", error);
  }

  return result;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function getLinkedArr(field: unknown): string[] {
  if (Array.isArray(field)) return field.filter((v): v is string => typeof v === "string");
  return [];
}
