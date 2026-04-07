import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";
import { CHARTER_FEE } from "@/lib/types";

interface InvoiceTeamLine {
  name: string;
  division: string;
  fee: number;
}

interface InvoicePDFProps {
  invoice: Invoice;
  charterName: string;
  charterState: string;
  teamLines: InvoiceTeamLine[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1C1C1C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "2px solid #2E3A87",
    paddingBottom: 15,
  },
  orgName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2E3A87",
  },
  orgSubtext: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2E3A87",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 6,
    padding: "3 8",
    borderRadius: 4,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 25,
  },
  sectionCol: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#2E3A87",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#999",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 10,
    marginBottom: 6,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2E3A87",
    padding: "6 10",
    borderRadius: 4,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#FFFFFF",
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 10",
    borderBottom: "1px solid #E5E5E5",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "8 10",
    borderBottom: "1px solid #E5E5E5",
    backgroundColor: "#F9F9F9",
  },
  colTeam: { width: "45%" },
  colDivision: { width: "30%" },
  colFee: { width: "25%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    padding: "10 10",
    borderTop: "2px solid #2E3A87",
    marginTop: 4,
  },
  totalLabel: {
    width: "75%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    paddingRight: 10,
  },
  totalValue: {
    width: "25%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#2E3A87",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
    borderTop: "1px solid #E5E5E5",
    paddingTop: 8,
  },
  notesSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#333",
    lineHeight: 1.4,
  },
  taxExemptBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#2E7D32",
    backgroundColor: "#E8F5E9",
    padding: "2 6",
    borderRadius: 3,
    alignSelf: "flex-start",
  },
});

export function InvoicePDF({ invoice, charterName, charterState, teamLines }: InvoicePDFProps) {
  const statusColor = invoice.paymentStatus === "Paid" ? "#2E7D32" :
    invoice.paymentStatus === "Pending" ? "#F57C00" :
    invoice.paymentStatus === "Refunded" ? "#C62828" : "#666";

  const createdDate = invoice.createdTime
    ? new Date(invoice.createdTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.orgName}>National High School BBQ Association®</Text>
            <Text style={styles.orgSubtext}>NHSBBQA® — America&apos;s CTE Food Sport™</Text>
            <Text style={styles.orgSubtext}>HighSchoolBBQLeague.com / HSBBQ.org</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={[styles.statusBadge, { color: statusColor }]}>
              {invoice.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Bill To / Invoice Details */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionCol}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.fieldValue}>{charterName}</Text>
            <Text style={styles.fieldValue}>{invoice.billingContact}</Text>
            <Text style={styles.fieldValue}>{invoice.billingEmail}</Text>
            {invoice.billingPhone && (
              <Text style={styles.fieldValue}>{invoice.billingPhone}</Text>
            )}
            {charterState && (
              <Text style={styles.fieldValue}>{charterState}</Text>
            )}
          </View>
          <View style={styles.sectionCol}>
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <Text style={styles.fieldLabel}>Date Issued</Text>
            <Text style={styles.fieldValue}>{createdDate}</Text>
            <Text style={styles.fieldLabel}>Payer Type</Text>
            <Text style={styles.fieldValue}>{invoice.payerType}</Text>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <Text style={styles.fieldValue}>{invoice.paymentMethod}</Text>
            <Text style={styles.fieldLabel}>AEU Type</Text>
            <Text style={styles.fieldValue}>{invoice.aeuType}</Text>
            {paidDate && (
              <>
                <Text style={styles.fieldLabel}>Paid On</Text>
                <Text style={styles.fieldValue}>{paidDate}</Text>
              </>
            )}
          </View>
        </View>

        {/* Tax Exempt */}
        {invoice.taxExempt && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.taxExemptBadge}>
              TAX EXEMPT — {invoice.taxExemptNumber || "Number on file"}
            </Text>
          </View>
        )}

        {/* Team Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colTeam]}>Team</Text>
            <Text style={[styles.tableHeaderText, styles.colDivision]}>Division</Text>
            <Text style={[styles.tableHeaderText, styles.colFee]}>Charter Fee</Text>
          </View>
          {teamLines.map((line, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colTeam}>{line.name}</Text>
              <Text style={styles.colDivision}>{line.division}</Text>
              <Text style={styles.colFee}>${line.fee.toFixed(2)}</Text>
            </View>
          ))}
          {teamLines.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colTeam}>Charter Registration</Text>
              <Text style={styles.colDivision}>—</Text>
              <Text style={styles.colFee}>${invoice.totalAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>${invoice.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          National High School BBQ Association® (NHSBBQA®) — America&apos;s CTE Food Sport™ — WHERE DREAMS IGNITE!™ — HighSchoolBBQLeague.com
        </Text>
      </Page>
    </Document>
  );
}
