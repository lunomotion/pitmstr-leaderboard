import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getInvoice, getSchool, searchTeams } from "@/lib/airtable";
import { InvoicePDF } from "@/lib/pdf/invoice";
import { CHARTER_FEE } from "@/lib/types";
import { requirePermission, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requirePermission("admin:access");
  if (isAuthError(auth)) return auth;

  try {
    const invoiceId = request.nextUrl.searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Get charter (school) info
    let charterName = invoice.charterName || "Unknown School";
    let charterState = "";
    if (invoice.charterId) {
      const school = await getSchool(invoice.charterId);
      if (school) {
        charterName = school.name;
        charterState = school.state || "";
      }
    }

    // Get teams for this charter to build line items
    const allTeams = await searchTeams("");
    const charterTeams = allTeams.filter((t) => t.schoolId === invoice.charterId);

    const teamLines = charterTeams.map((t) => ({
      name: t.name,
      division: t.division || "—",
      fee: CHARTER_FEE,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        invoice,
        charterName,
        charterState,
        teamLines,
      }) as any
    );

    const filename = `NHSBBQA-Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
