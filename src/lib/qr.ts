/**
 * QR Code Generation for NHSBBQA® PITMSTR
 *
 * Generates QR codes for:
 *   - Team check-in at events
 *   - Turn-in box labels per food category
 *   - Team fan pages
 *   - Credential verification
 *
 * QR codes encode URLs pointing to the PITMSTR app routes.
 */

import QRCode from "qrcode";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://highschoolbbqleague.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QRCodeData {
  /** Label displayed above the QR code (e.g., "CHECK-IN", "BRISKET") */
  label: string;
  /** The URL encoded in the QR code */
  url: string;
  /** Data URI of the generated QR code PNG */
  dataUri: string;
}

export interface TeamQRSheetData {
  teamName: string;
  schoolName: string;
  district: string;
  eventName: string;
  eventId: string;
  teamId: string;
  /** QR codes for check-in + each food category */
  codes: QRCodeData[];
}

// ---------------------------------------------------------------------------
// URL Builders
// ---------------------------------------------------------------------------

/** Build the URL for a team check-in scan */
export function buildCheckInUrl(eventId: string, teamId: string): string {
  return `${BASE_URL}/scan/checkin/${eventId}/${teamId}`;
}

/** Build the URL for a turn-in box scan */
export function buildTurnInUrl(
  eventId: string,
  teamId: string,
  category: string
): string {
  const slug = category.toLowerCase().replace(/\s+/g, "-");
  return `${BASE_URL}/scan/turnin/${eventId}/${teamId}/${slug}`;
}

/** Build the URL for a team fan page */
export function buildTeamPageUrl(teamId: string): string {
  return `${BASE_URL}/teams/${teamId}`;
}

/** Build the URL for credential verification */
export function buildVerificationUrl(verificationId: string): string {
  return `${BASE_URL}/verify/${verificationId}`;
}

// ---------------------------------------------------------------------------
// QR Code Generation
// ---------------------------------------------------------------------------

/**
 * Generate a QR code as a PNG data URI.
 *
 * Uses error correction level H (30%) to allow for logo overlay.
 */
export async function generateQRDataUri(
  url: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
): Promise<string> {
  const dataUri = await QRCode.toDataURL(url, {
    width: options?.width || 200,
    margin: options?.margin || 1,
    errorCorrectionLevel: options?.errorCorrectionLevel || "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
  return dataUri;
}

/**
 * Generate a QR code as a PNG buffer (for PDF embedding).
 */
export async function generateQRBuffer(
  url: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(url, {
    width: options?.width || 200,
    margin: options?.margin || 1,
    errorCorrectionLevel: options?.errorCorrectionLevel || "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
  return buffer;
}

// ---------------------------------------------------------------------------
// Team QR Sheet Generator
// ---------------------------------------------------------------------------

/**
 * Generate all QR codes needed for a team's turn-in sheet at an event.
 *
 * Produces:
 *   1. Check-In QR code
 *   2. One QR code per food category
 *
 * Returns TeamQRSheetData ready for PDF rendering.
 */
export async function generateTeamQRSheet(input: {
  teamId: string;
  teamName: string;
  schoolName: string;
  district: string;
  eventId: string;
  eventName: string;
  categories: string[];
}): Promise<TeamQRSheetData> {
  const codes: QRCodeData[] = [];

  // Check-In QR
  const checkInUrl = buildCheckInUrl(input.eventId, input.teamId);
  codes.push({
    label: "CHECK-IN",
    url: checkInUrl,
    dataUri: await generateQRDataUri(checkInUrl),
  });

  // Category QR codes
  for (const category of input.categories) {
    const turnInUrl = buildTurnInUrl(input.eventId, input.teamId, category);
    codes.push({
      label: category.toUpperCase(),
      url: turnInUrl,
      dataUri: await generateQRDataUri(turnInUrl),
    });
  }

  return {
    teamName: input.teamName,
    schoolName: input.schoolName,
    district: input.district,
    eventName: input.eventName,
    eventId: input.eventId,
    teamId: input.teamId,
    codes,
  };
}
