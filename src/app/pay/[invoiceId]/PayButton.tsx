"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";

export default function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const json = await res.json();
      if (!json.success || !json.url) {
        throw new Error(json.error || "Unable to start checkout");
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        aria-busy={loading}
        aria-label="Pay invoice with credit card"
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#C62828] hover:bg-[#8E0000] text-white font-semibold text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Redirecting to Stripe...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" aria-hidden="true" />
            Pay Invoice
          </>
        )}
      </button>
      {error && (
        <div role="alert" aria-live="polite" className="mt-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
