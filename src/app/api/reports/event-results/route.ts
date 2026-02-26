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
import { EventReport } from "@/lib/pdf/event-report";
import { getEvent, getEventLeaderboard } from "@/lib/airtable";
import type { TeamEventScore, CategoryResult } from "@/lib/scoring";

export async function GET(request: NextRequest) {
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

    // Convert leaderboard entries to TeamEventScore format for the PDF
    // This bridges the existing leaderboard data to the MEAT scoring format.
    // When full judge-level scoring is available in Airtable, this will use
    // the scoring engine directly.
    const teamScores: TeamEventScore[] = leaderboard.map((entry) => {
      const categories: CategoryResult[] = Object.entries(
        entry.categoryScores
      ).map(([catName, catData]) => ({
        categoryName: catName,
        components: {
          M: 0, // Not available from leaderboard aggregation
          E: 0,
          A: 0,
          T: 0,
        },
        score: catData?.score ?? 0,
      }));

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
