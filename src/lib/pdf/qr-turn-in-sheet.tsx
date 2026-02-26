/**
 * QR Code Turn-In Sheet PDF Template
 *
 * Matches the NHSBBQA® QR Code PDF format:
 *   - NHSBBQA logo header
 *   - Team Name, High School, School District
 *   - Grid of QR codes (one per category + check-in)
 *   - Each QR has a blue header label
 *   - Labels are cut and placed on turn-in boxes
 *   - Copyright footer
 *
 * Uses @react-pdf/renderer for serverless PDF generation.
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { QRCodeData } from "../qr";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QRTurnInSheetProps {
  teamName: string;
  schoolName: string;
  district: string;
  eventName: string;
  codes: QRCodeData[];
  /** Path or data URI for the NHSBBQA logo */
  logoSrc?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QRTurnInSheet({
  teamName,
  schoolName,
  district,
  eventName,
  codes,
  logoSrc,
}: QRTurnInSheetProps) {
  return (
    <Document
      title={`QR Turn-In Sheet - ${teamName}`}
      author="NHSBBQA®"
      subject={`Turn-In QR Codes for ${teamName} at ${eventName}`}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Logo */}
        {logoSrc && (
          <View style={styles.logoContainer}>
            <Image src={logoSrc} style={styles.logo} />
          </View>
        )}

        {/* Team Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerField}>TEAM NAME: {teamName}</Text>
          <Text style={styles.headerField}>HIGH SCHOOL: {schoolName}</Text>
          <Text style={styles.headerField}>SCHOOL DISTRICT: {district}</Text>
          <Text style={styles.eventName}>Event: {eventName}</Text>
        </View>

        {/* Instruction */}
        <Text style={styles.instruction}>
          (REMOVE LABELS AND PLACE ON TURN-IN BOX FOR EACH FOOD CATEGORY)
        </Text>

        {/* QR Code Grid */}
        <View style={styles.grid}>
          {codes.map((code) => (
            <View key={code.label} style={styles.qrCell}>
              <View style={styles.qrLabel}>
                <Text style={styles.qrLabelText}>{code.label}</Text>
              </View>
              <Image src={code.dataUri} style={styles.qrImage} />
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {new Date().getFullYear()} Copyright – National High School BBQ
            Association®
          </Text>
        </View>
      </Page>
    </Document>
  );
}
