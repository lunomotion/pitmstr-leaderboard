import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/airtable";
import { CheckCircle2, XCircle, Receipt, ShieldCheck, Lock } from "lucide-react";
import PayButton from "./PayButton";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const { invoiceId } = await params;
  const { success, canceled } = await searchParams;

  const invoice = await getInvoice(invoiceId);
  if (!invoice) notFound();

  const isPaid = invoice.paymentStatus === "Paid" || success === "1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium">
            <Receipt className="w-4 h-4" />
            NHSBBQA Invoice Payment
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-[#2E3A87] to-[#4A5BA8] text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">
                  Invoice
                </div>
                <div className="text-2xl font-bold font-mono">
                  {invoice.invoiceNumber}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider opacity-80">
                  Amount Due
                </div>
                <div className="text-2xl font-bold">
                  ${invoice.totalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {isPaid && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-900">Payment received</div>
                  <div className="text-sm text-green-700">
                    Thank you. A receipt has been emailed to {invoice.billingEmail}.
                  </div>
                </div>
              </div>
            )}

            {canceled === "1" && !isPaid && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <XCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-amber-900">Payment canceled</div>
                  <div className="text-sm text-amber-700">
                    You can complete payment anytime using the button below.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Row label="Charter" value={invoice.charterName || "—"} />
              <Row label="Billed To" value={invoice.billingContact} />
              <Row label="Email" value={invoice.billingEmail} />
              {invoice.billingPhone && (
                <Row label="Phone" value={invoice.billingPhone} />
              )}
              <Row label="Payer Type" value={invoice.payerType} />
              <Row label="Status" value={invoice.paymentStatus} />
            </div>

            {!isPaid && (
              <div className="pt-4 border-t border-slate-100">
                <PayButton invoiceId={invoice.id} />
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure checkout
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Powered by Stripe
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          National High School BBQ Association · HighSchoolBBQLeague.com
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
