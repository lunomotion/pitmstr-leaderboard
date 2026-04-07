import { NextRequest, NextResponse } from "next/server";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  searchTeams,
} from "@/lib/airtable";
import type { PayerType, PaymentMethod, PaymentStatus, AEUType } from "@/lib/types";
import { CHARTER_FEE } from "@/lib/types";

// GET /api/admin/invoices — list all invoices with optional status filter
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") as PaymentStatus | null;
    const invoices = await getInvoices({
      paymentStatus: status || undefined,
    });

    // Fetch all teams once, then enrich each invoice with team count
    let allTeams: { schoolId: string }[] = [];
    try {
      allTeams = await searchTeams(" ");
    } catch {
      // continue without team counts
    }

    const enriched = invoices.map((inv) => {
      if (!inv.charterId) return inv;
      const charterTeams = allTeams.filter((t) => t.schoolId === inv.charterId);
      return { ...inv, teamCount: charterTeams.length };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/admin/invoices — create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      charterId,
      billingContact,
      billingEmail,
      billingPhone,
      payerType,
      aeuType,
      paymentMethod,
      teamCount,
      taxExempt,
      taxExemptNumber,
      notes,
    } = body;

    if (!charterId || !billingContact || !billingEmail || !payerType || !aeuType || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const totalAmount = (teamCount || 1) * CHARTER_FEE;

    const invoice = await createInvoice({
      charterId,
      billingContact,
      billingEmail,
      billingPhone: billingPhone || "",
      payerType: payerType as PayerType,
      aeuType: aeuType as AEUType,
      paymentMethod: paymentMethod as PaymentMethod,
      totalAmount,
      taxExempt: taxExempt || false,
      taxExemptNumber: taxExemptNumber || "",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/invoices — update an invoice
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, ...data } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const invoice = await updateInvoice(invoiceId, data);
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
