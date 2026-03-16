/**
 * Event Results Report PDF Template
 *
 * Generates a multi-page event report with:
 *   - Event header (name, date, location, division)
 *   - Overall standings with MEAT score breakdown
 *   - Per-category rankings
 *   - Configurable teams-per-page (5, 10, 25)
 *   - NHSBBQA branding
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
import type { TeamEventScore, CategoryResult } from "../scoring";
import { formatStateAssociation } from "../format";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EventReportProps {
  eventName: string;
  eventDate: string;
  location: string;
  division: string;
  /** State abbreviation (e.g., "TX") for association branding */
  state?: string;
  /** Ranked team scores (already sorted by rankTeams()) */
  teams: TeamEventScore[];
  /** How many teams per page (default 10) */
  teamsPerPage?: number;
  /** Only show top N teams (0 = all) */
  topN?: number;
  /** Path or data URI for the NHSBBQA logo */
  logoSrc?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  primary: "#C62828", // bbq-red
  secondary: "#1e3a8a", // americana-blue
  gold: "#D4A017",
  silver: "#A0A0A0",
  bronze: "#CD7F32",
  headerBg: "#1e3a8a",
  rowEven: "#F8F8F8",
  rowOdd: "#FFFFFF",
  border: "#E0E0E0",
  text: "#333333",
  muted: "#999999",
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    fontSize: 9,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: "auto",
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.secondary,
    marginBottom: 3,
  },
  eventSubtitle: {
    fontSize: 10,
    color: colors.text,
    marginBottom: 2,
  },
  divisionBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  // Section heading
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 6,
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 3,
  },
  // Table
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `0.5px solid ${colors.border}`,
  },
  // Column widths for overall standings
  colRank: { width: "6%" },
  colTeam: { width: "22%", paddingRight: 4 },
  colSchool: { width: "20%", paddingRight: 4 },
  colState: { width: "6%", textAlign: "center" as const },
  colM: { width: "8%", textAlign: "right" as const },
  colE: { width: "8%", textAlign: "right" as const },
  colA: { width: "8%", textAlign: "right" as const },
  colT: { width: "8%", textAlign: "right" as const },
  colTotal: { width: "10%", textAlign: "right" as const },
  colMax: { width: "4%", textAlign: "right" as const },
  // Category table columns
  catColRank: { width: "8%" },
  catColTeam: { width: "30%", paddingRight: 4 },
  catColSchool: { width: "25%", paddingRight: 4 },
  catColM: { width: "9%", textAlign: "right" as const },
  catColE: { width: "9%", textAlign: "right" as const },
  catColA: { width: "9%", textAlign: "right" as const },
  catColT: { width: "9%", textAlign: "right" as const },
  catColScore: { width: "10%", textAlign: "right" as const },
  // Text styles
  cellText: {
    fontSize: 8,
    color: colors.text,
  },
  cellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
  },
  rankText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5px solid ${colors.border}`,
    paddingTop: 5,
  },
  footerText: {
    fontSize: 6,
    color: colors.muted,
  },
  // Summary stats
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 10,
  },
  statBox: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRankColor(rank: number): string {
  if (rank === 1) return colors.gold;
  if (rank === 2) return colors.silver;
  if (rank === 3) return colors.bronze;
  return colors.text;
}

function formatScore(score: number): string {
  return score.toFixed(2);
}

/** Chunk an array into pages */
function chunk<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    pages.push(arr.slice(i, i + size));
  }
  return pages;
}

/**
 * Get aggregated component totals across all categories for a team.
 * Used for the overall standings MEAT breakdown columns.
 */
function getComponentTotals(categories: CategoryResult[]) {
  return {
    M: categories.reduce((s, c) => s + c.components.M, 0),
    E: categories.reduce((s, c) => s + c.components.E, 0),
    A: categories.reduce((s, c) => s + c.components.A, 0),
    T: categories.reduce((s, c) => s + c.components.T, 0),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReportHeader({
  eventName,
  eventDate,
  location,
  division,
  state,
  logoSrc,
}: {
  eventName: string;
  eventDate: string;
  location: string;
  division: string;
  state?: string;
  logoSrc?: string;
}) {
  const stateLabel = formatStateAssociation(state);

  return (
    <View>
      {stateLabel && (
        <Text style={{
          fontSize: 12,
          fontFamily: "Helvetica-Bold",
          textAlign: "center",
          color: "#1e3a8a",
          marginBottom: 8,
        }}>{stateLabel}</Text>
      )}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.eventTitle}>{eventName}</Text>
          <Text style={styles.eventSubtitle}>{eventDate}</Text>
          <Text style={styles.eventSubtitle}>{location}</Text>
          <Text style={styles.divisionBadge}>{division}</Text>
        </View>
        {logoSrc && <Image src={logoSrc} style={styles.logo} />}
      </View>
    </View>
  );
}

function OverallStandingsTable({
  teams,
}: {
  teams: TeamEventScore[];
}) {
  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colRank]}>#</Text>
        <Text style={[styles.tableHeaderText, styles.colTeam]}>Team</Text>
        <Text style={[styles.tableHeaderText, styles.colSchool]}>School</Text>
        <Text style={[styles.tableHeaderText, styles.colState]}>ST</Text>
        <Text style={[styles.tableHeaderText, styles.colM]}>M (10%)</Text>
        <Text style={[styles.tableHeaderText, styles.colE]}>E (50%)</Text>
        <Text style={[styles.tableHeaderText, styles.colA]}>A (20%)</Text>
        <Text style={[styles.tableHeaderText, styles.colT]}>T (20%)</Text>
        <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
      </View>

      {/* Rows */}
      {teams.map((team, idx) => {
        const totals = getComponentTotals(team.categories);
        const bgColor = idx % 2 === 0 ? colors.rowEven : colors.rowOdd;

        return (
          <View
            key={team.teamId}
            style={[styles.tableRow, { backgroundColor: bgColor }]}
          >
            <Text
              style={[
                styles.rankText,
                styles.colRank,
                { color: getRankColor(team.rank) },
              ]}
            >
              {team.rank}
            </Text>
            <Text style={[styles.cellBold, styles.colTeam]}>
              {team.teamName}
            </Text>
            <Text style={[styles.cellText, styles.colSchool]}>
              {team.schoolName}
            </Text>
            <Text style={[styles.cellText, styles.colState]}>
              {team.state}
            </Text>
            <Text style={[styles.cellText, styles.colM]}>
              {formatScore(totals.M)}
            </Text>
            <Text style={[styles.cellText, styles.colE]}>
              {formatScore(totals.E)}
            </Text>
            <Text style={[styles.cellText, styles.colA]}>
              {formatScore(totals.A)}
            </Text>
            <Text style={[styles.cellText, styles.colT]}>
              {formatScore(totals.T)}
            </Text>
            <Text style={[styles.cellBold, styles.colTotal]}>
              {formatScore(team.eventTotal)}/{team.maxPossible}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CategoryStandingsTable({
  categoryName,
  teams,
}: {
  categoryName: string;
  teams: { rank: number; teamName: string; schoolName: string; result: CategoryResult }[];
}) {
  return (
    <View style={styles.table} wrap={false}>
      <Text style={styles.sectionTitle}>{categoryName}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.catColRank]}>#</Text>
        <Text style={[styles.tableHeaderText, styles.catColTeam]}>Team</Text>
        <Text style={[styles.tableHeaderText, styles.catColSchool]}>
          School
        </Text>
        <Text style={[styles.tableHeaderText, styles.catColM]}>M</Text>
        <Text style={[styles.tableHeaderText, styles.catColE]}>E</Text>
        <Text style={[styles.tableHeaderText, styles.catColA]}>A</Text>
        <Text style={[styles.tableHeaderText, styles.catColT]}>T</Text>
        <Text style={[styles.tableHeaderText, styles.catColScore]}>Score</Text>
      </View>

      {teams.map((entry, idx) => {
        const bgColor = idx % 2 === 0 ? colors.rowEven : colors.rowOdd;
        return (
          <View
            key={`${categoryName}-${entry.teamName}`}
            style={[styles.tableRow, { backgroundColor: bgColor }]}
          >
            <Text
              style={[
                styles.rankText,
                styles.catColRank,
                { color: getRankColor(entry.rank) },
              ]}
            >
              {entry.rank}
            </Text>
            <Text style={[styles.cellBold, styles.catColTeam]}>
              {entry.teamName}
            </Text>
            <Text style={[styles.cellText, styles.catColSchool]}>
              {entry.schoolName}
            </Text>
            <Text style={[styles.cellText, styles.catColM]}>
              {formatScore(entry.result.components.M)}
            </Text>
            <Text style={[styles.cellText, styles.catColE]}>
              {formatScore(entry.result.components.E)}
            </Text>
            <Text style={[styles.cellText, styles.catColA]}>
              {formatScore(entry.result.components.A)}
            </Text>
            <Text style={[styles.cellText, styles.catColT]}>
              {formatScore(entry.result.components.T)}
            </Text>
            <Text style={[styles.cellBold, styles.catColScore]}>
              {formatScore(entry.result.score)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EventReport({
  eventName,
  eventDate,
  location,
  division,
  state,
  teams,
  teamsPerPage = 10,
  topN = 0,
  logoSrc,
}: EventReportProps) {
  // Apply topN filter
  const displayTeams = topN > 0 ? teams.slice(0, topN) : teams;

  // Chunk teams for pagination
  const overallPages = chunk(displayTeams, teamsPerPage);

  // Collect all unique category names across all teams
  const categoryNames = [
    ...new Set(
      displayTeams.flatMap((t) => t.categories.map((c) => c.categoryName))
    ),
  ];

  // Build per-category rankings
  const categoryRankings = categoryNames.map((catName) => {
    const entries = displayTeams
      .map((team) => {
        const result = team.categories.find((c) => c.categoryName === catName);
        if (!result) return null;
        return {
          teamName: team.teamName,
          schoolName: team.schoolName,
          result,
          rank: 0,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b.result.score - a.result.score);

    // Assign category ranks
    entries.forEach((entry, i) => {
      if (i > 0 && entry.result.score === entries[i - 1].result.score) {
        entry.rank = entries[i - 1].rank;
      } else {
        entry.rank = i + 1;
      }
    });

    return { categoryName: catName, entries };
  });

  return (
    <Document
      title={`Event Report - ${eventName}`}
      author="NHSBBQA®"
      subject={`Official results for ${eventName}`}
    >
      {/* Overall Standings Pages */}
      {overallPages.map((pageTeams, pageIdx) => (
        <Page key={`overall-${pageIdx}`} size="LETTER" style={styles.page}>
          <ReportHeader
            eventName={eventName}
            eventDate={eventDate}
            location={location}
            division={division}
            state={state}
            logoSrc={logoSrc}
          />

          {/* Summary stats on first page only */}
          {pageIdx === 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{displayTeams.length}</Text>
                <Text style={styles.statLabel}>Teams</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{categoryNames.length}</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {displayTeams.length > 0
                    ? formatScore(displayTeams[0].eventTotal)
                    : "—"}
                </Text>
                <Text style={styles.statLabel}>Top Score</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {displayTeams.length > 0
                    ? displayTeams[0].maxPossible.toString()
                    : "—"}
                </Text>
                <Text style={styles.statLabel}>Max Possible</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Overall Standings
            {overallPages.length > 1
              ? ` (Page ${pageIdx + 1} of ${overallPages.length})`
              : ""}
          </Text>

          <OverallStandingsTable teams={pageTeams} />

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              NHSBBQA® M.E.A.T. Scoring System | M=10% E=50% A=20% T=20%
            </Text>
            <Text style={styles.footerText}>
              Generated {new Date().toLocaleDateString()} | Official Results
            </Text>
          </View>
        </Page>
      ))}

      {/* Per-Category Pages */}
      {categoryRankings.map((cat) => {
        const catPages = chunk(cat.entries, teamsPerPage);

        return catPages.map((pageEntries, pageIdx) => (
          <Page
            key={`${cat.categoryName}-${pageIdx}`}
            size="LETTER"
            style={styles.page}
          >
            <ReportHeader
              eventName={eventName}
              eventDate={eventDate}
              location={location}
              division={division}
              logoSrc={logoSrc}
            />

            <CategoryStandingsTable
              categoryName={
                cat.categoryName +
                (catPages.length > 1
                  ? ` (Page ${pageIdx + 1} of ${catPages.length})`
                  : "")
              }
              teams={pageEntries}
            />

            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>
                NHSBBQA® M.E.A.T. Scoring System | M=10% E=50% A=20% T=20%
              </Text>
              <Text style={styles.footerText}>
                Generated {new Date().toLocaleDateString()} | Official Results
              </Text>
            </View>
          </Page>
        ));
      })}
    </Document>
  );
}
