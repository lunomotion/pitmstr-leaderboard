/**
 * GET /api/reports/qr-sheet-batch?eventId=...
 *
 * Generates a SINGLE multi-page PDF containing QR Turn-In Sheets
 * for ALL teams registered at an event. One page per team.
 * Print once, cut, and distribute.
 *
 * Query params:
 *   eventId - Airtable event record ID (required)
 *
 * Returns: PDF file (application/pdf)
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { generateTeamQRSheet } from "@/lib/qr";
import { getEvent, getSchool } from "@/lib/airtable";
import { formatStateAssociation } from "@/lib/format";
import type { QRCodeData } from "@/lib/qr";
import Airtable from "airtable";

// ---------------------------------------------------------------------------
// Batch PDF Component — all teams in one document
// ---------------------------------------------------------------------------

interface TeamSheetData {
  teamName: string;
  schoolName: string;
  district: string;
  eventName: string;
  codes: QRCodeData[];
}

interface BatchQRSheetProps {
  teams: TeamSheetData[];
  stateLabel?: string;
  logoSrc?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    width: 140,
    height: "auto",
  },
  headerInfo: {
    marginBottom: 10,
  },
  headerField: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  eventName: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 8,
    textAlign: "center",
    color: "#333333",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  qrCell: {
    width: "23%",
    marginBottom: 10,
    alignItems: "center",
    border: "1px solid #E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  qrLabel: {
    width: "100%",
    backgroundColor: "#4472C4",
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  qrLabelText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    textAlign: "center",
  },
  qrImage: {
    width: 110,
    height: 110,
    margin: 6,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#999999",
  },
  pageNumber: {
    fontSize: 7,
    color: "#999999",
    textAlign: "right",
    marginTop: 4,
  },
});

function BatchQRSheet({ teams, stateLabel, logoSrc }: BatchQRSheetProps) {
  return React.createElement(
    Document,
    {
      title: `QR Turn-In Sheets - ${teams.length} Teams`,
      author: "NHSBBQA®",
      subject: "Batch QR Turn-In Sheets",
    },
    teams.map((team, teamIdx) =>
      React.createElement(
        Page,
        { key: teamIdx, size: "LETTER", style: styles.page },
        // Logo
        logoSrc &&
          React.createElement(
            View,
            { style: styles.logoContainer },
            React.createElement(Image, { src: logoSrc, style: styles.logo })
          ),
        // State Association Branding
        stateLabel &&
          React.createElement(
            Text,
            {
              style: {
                fontSize: 12,
                fontFamily: "Helvetica-Bold",
                textAlign: "center",
                color: "#1e3a8a",
                marginBottom: 12,
              },
            },
            stateLabel
          ),
        // Team Info
        React.createElement(
          View,
          { style: styles.headerInfo },
          React.createElement(
            Text,
            { style: styles.headerField },
            `TEAM NAME: ${team.teamName}`
          ),
          React.createElement(
            Text,
            { style: styles.headerField },
            `HIGH SCHOOL: ${team.schoolName}`
          ),
          React.createElement(
            Text,
            { style: styles.headerField },
            `SCHOOL DISTRICT: ${team.district}`
          ),
          React.createElement(
            Text,
            { style: styles.eventName },
            `Event: ${team.eventName}`
          )
        ),
        // Instruction
        React.createElement(
          Text,
          { style: styles.instruction },
          "(REMOVE LABELS AND PLACE ON TURN-IN BOX FOR EACH FOOD CATEGORY)"
        ),
        // QR Grid
        React.createElement(
          View,
          { style: styles.grid },
          team.codes.map((code) =>
            React.createElement(
              View,
              { key: code.label, style: styles.qrCell },
              React.createElement(
                View,
                { style: styles.qrLabel },
                React.createElement(
                  Text,
                  { style: styles.qrLabelText },
                  code.label
                )
              ),
              React.createElement(Image, {
                src: code.dataUri,
                style: styles.qrImage,
              })
            )
          )
        ),
        // Footer
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            Text,
            { style: styles.footerText },
            `${new Date().getFullYear()} Copyright – National High School BBQ Association®`
          ),
          React.createElement(
            Text,
            { style: styles.pageNumber },
            `Team ${teamIdx + 1} of ${teams.length}`
          )
        )
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Airtable helpers (fetching teams for an event)
// ---------------------------------------------------------------------------

function getBase(): Airtable.Base {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) throw new Error("Airtable not configured");
  return new Airtable({ apiKey }).base(baseId);
}

function getLinkedIds(field: unknown): string[] {
  if (Array.isArray(field)) {
    return field.filter((id): id is string => typeof id === "string");
  }
  return [];
}

function getFirstLinkedId(field: unknown): string | undefined {
  if (Array.isArray(field) && field.length > 0 && typeof field[0] === "string") {
    return field[0];
  }
  return undefined;
}

interface BasicTeam {
  id: string;
  name: string;
  schoolName: string;
  schoolId: string;
}

async function getEventTeams(eventId: string): Promise<BasicTeam[]> {
  const base = getBase();
  const eventRecord = await base("Events").find(eventId);
  const teamIds = getLinkedIds(eventRecord.get("Teams"));

  if (teamIds.length === 0) return [];

  const teams: BasicTeam[] = [];

  for (const teamId of teamIds) {
    try {
      const record = await base("Teams").find(teamId);
      const charterId = getFirstLinkedId(record.get("Charter"));
      let schoolName = "";
      let schoolId = "";

      if (charterId) {
        try {
          const charter = await base("Charter").find(charterId);
          schoolName = (charter.get("Charter Name") as string) || "";
          schoolId = charter.id;
        } catch {
          // ignore
        }
      }

      teams.push({
        id: record.id,
        name: (record.get("Team Name") as string) || "",
        schoolName,
        schoolId,
      });
    } catch {
      // skip teams that fail to fetch
    }
  }

  return teams;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    // Fetch event
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: `Event not found: ${eventId}` },
        { status: 404 }
      );
    }

    // Fetch all teams for this event
    const teams = await getEventTeams(eventId);

    if (teams.length === 0) {
      return NextResponse.json(
        { success: false, error: "No teams registered for this event" },
        { status: 404 }
      );
    }

    // Generate QR sheets for all teams
    const categories = event.categories.filter((c) => c !== "Overall");
    const teamSheets: TeamSheetData[] = [];

    for (const team of teams) {
      // Get district
      let district = "";
      if (team.schoolId) {
        const school = await getSchool(team.schoolId);
        district = school?.district || "";
      }

      const qrData = await generateTeamQRSheet({
        teamId: team.id,
        teamName: team.name,
        schoolName: team.schoolName,
        district,
        eventId: event.id,
        eventName: event.name,
        categories,
      });

      teamSheets.push({
        teamName: qrData.teamName,
        schoolName: qrData.schoolName,
        district: qrData.district,
        eventName: qrData.eventName,
        codes: qrData.codes,
      });
    }

    // Build logo URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const logoSrc = `${baseUrl}/images/nhsbbqa-logo.png`;

    // Render single multi-page PDF
    const stateLabel = formatStateAssociation(event.state);

    const element = React.createElement(BatchQRSheet, {
      teams: teamSheets,
      stateLabel: stateLabel || undefined,
      logoSrc,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(element as any);

    const filename = `QR_Sheets_All_Teams_${event.name.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Batch QR sheet generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate batch QR sheets" },
      { status: 500 }
    );
  }
}
