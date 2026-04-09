import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import JSZip from "jszip";
import { getInvoice, getSchool, searchTeams, getVendorDocuments } from "@/lib/airtable";
import { InvoicePDF } from "@/lib/pdf/invoice";
import { CHARTER_FEE } from "@/lib/types";

// GET /api/reports/payment-package?invoiceId=XXX
// Returns a ZIP containing the invoice PDF + all active vendor documents
export async function GET(request: NextRequest) {
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

    // Build invoice PDF
    let charterName = invoice.charterName || "Unknown School";
    let charterState = "";
    if (invoice.charterId) {
      const school = await getSchool(invoice.charterId);
      if (school) {
        charterName = school.name;
        charterState = school.state || "";
      }
    }

    const allTeams = await searchTeams("");
    const charterTeams = allTeams.filter((t) => t.schoolId === invoice.charterId);
    const teamLines = charterTeams.map((t) => ({
      name: t.name,
      division: t.division || "—",
      fee: CHARTER_FEE,
    }));

    const invoicePdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(InvoicePDF, {
        invoice,
        charterName,
        charterState,
        teamLines,
      }) as any
    );

    // Fetch vendor documents
    const vendorDocs = await getVendorDocuments();

    // Build ZIP
    const zip = new JSZip();
    const invoiceFilename = `1-Invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
    zip.file(invoiceFilename, new Uint8Array(invoicePdfBuffer));

    // Download each vendor doc and add to ZIP
    let index = 2;
    for (const doc of vendorDocs) {
      try {
        const res = await fetch(doc.fileUrl);
        if (!res.ok) continue;
        const buf = new Uint8Array(await res.arrayBuffer());
        const ext = doc.fileName.split(".").pop() || "pdf";
        const safeName = doc.type.replace(/[^a-zA-Z0-9]/g, "-");
        zip.file(`${index}-${safeName}.${ext}`, buf);
        index++;
      } catch (err) {
        console.error(`Failed to fetch vendor doc ${doc.type}:`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });
    const zipFilename = `NHSBBQA-PaymentPackage-${invoice.invoiceNumber || invoice.id}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating payment package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payment package" },
      { status: 500 }
    );
  }
}
