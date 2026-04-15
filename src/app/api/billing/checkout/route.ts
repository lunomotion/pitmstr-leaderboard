import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/airtable";
import { getStripe } from "@/lib/stripe";

// POST /api/billing/checkout — creates a Stripe Checkout Session for an invoice
// Body: { invoiceId: string }
// Returns: { url: string }
export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Missing invoiceId" },
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

    if (invoice.paymentStatus === "Paid") {
      return NextResponse.json(
        { success: false, error: "Invoice already paid" },
        { status: 400 }
      );
    }

    const origin =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://highschoolbbqleague.com";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.billingEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `NHSBBQA Charter — ${invoice.charterName || "Team Charter"}`,
              description: `Invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      success_url: `${origin}/pay/${invoice.id}?success=1`,
      cancel_url: `${origin}/pay/${invoice.id}?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    // Flip status to Pending so dashboard reflects in-flight payment
    try {
      await updateInvoice(invoice.id, { paymentStatus: "Pending" });
    } catch {
      // non-fatal; webhook will mark Paid on completion
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
