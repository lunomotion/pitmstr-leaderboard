/**
 * GET /api/reports/qr-sheet?teamId=...&eventId=...
 *
 * Generates a QR Code Turn-In Sheet PDF for a team at an event.
 *
 * Query params:
 *   teamId  - Airtable team record ID
 *   eventId - Airtable event record ID
 *
 * Returns: PDF file (application/pdf)
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { QRTurnInSheet } from "@/lib/pdf/qr-turn-in-sheet";
import { generateTeamQRSheet } from "@/lib/qr";
import { getTeam, getEvent, getSchool } from "@/lib/airtable";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const eventId = searchParams.get("eventId");

    if (!teamId || !eventId) {
      return NextResponse.json(
        { success: false, error: "teamId and eventId are required" },
        { status: 400 }
      );
    }

    // Fetch team and event data from Airtable
    const [team, event] = await Promise.all([
      getTeam(teamId),
      getEvent(eventId),
    ]);

    if (!team) {
      return NextResponse.json(
        { success: false, error: `Team not found: ${teamId}` },
        { status: 404 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: `Event not found: ${eventId}` },
        { status: 404 }
      );
    }

    // Get school/district info
    let district = "";
    if (team.schoolId) {
      const school = await getSchool(team.schoolId);
      district = school?.district || "";
    }

    // Generate QR codes
    const qrData = await generateTeamQRSheet({
      teamId: team.id,
      teamName: team.name,
      schoolName: team.schoolName || "",
      district,
      eventId: event.id,
      eventName: event.name,
      categories: event.categories.filter((c) => c !== "Overall"),
    });

    // Build the logo path for the PDF
    // In production, use absolute URL; in dev, use file path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const logoSrc = `${baseUrl}/images/nhsbbqa-logo.png`;

    // Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(QRTurnInSheet, {
        teamName: qrData.teamName,
        schoolName: qrData.schoolName,
        district: qrData.district,
        eventName: qrData.eventName,
        codes: qrData.codes,
        state: event.state || "",
        logoSrc,
      }) as any
    );

    // Return PDF
    const filename = `QR_Sheet_${team.name.replace(/\s+/g, "_")}_${event.name.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("QR sheet generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate QR sheet PDF" },
      { status: 500 }
    );
  }
}
