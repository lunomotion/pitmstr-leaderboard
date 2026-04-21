"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Search,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Package,
  TrendingUp,
  CreditCard,
  Link as LinkIcon,
} from "lucide-react";
import type {
  Invoice,
  PayerType,
  PaymentMethod,
  PaymentStatus,
  AEUType,
} from "@/lib/types";
import {
  PAYER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  AEU_TYPES,
  CHARTER_FEE,
} from "@/lib/types";

type TimePeriod = "month" | "year" | "all";

interface CharterOption {
  id: string;
  name: string;
  city: string;
  state: string;
  teamCount: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("year");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [charters, setCharters] = useState<CharterOption[]>([]);
  const [chartersLoading, setChartersLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/invoices?${params}`);
      const json = await res.json();
      if (json.success) setInvoices(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function fetchCharters() {
    setChartersLoading(true);
    try {
      const res = await fetch("/api/schools?q=");
      const json = await res.json();
      if (json.success) {
        // Also get team counts
        const teamsRes = await fetch("/api/teams?q=");
        const teamsJson = await teamsRes.json();
        const teams = teamsJson.success ? teamsJson.data : [];

        const charterOptions: CharterOption[] = (json.data || []).map(
          (s: { id: string; name: string; city: string; state: string }) => ({
            id: s.id,
            name: s.name,
            city: s.city,
            state: s.state,
            teamCount: teams.filter(
              (t: { schoolId: string }) => t.schoolId === s.id
            ).length,
          })
        );
        setCharters(charterOptions);
      }
    } catch {
      // silent
    } finally {
      setChartersLoading(false);
    }
  }

  // Filter invoices by time period for stats
  const periodFilteredInvoices = useMemo(() => {
    if (timePeriod === "all") return invoices;
    const now = new Date();
    return invoices.filter((inv) => {
      if (!inv.createdTime) return false;
      const d = new Date(inv.createdTime);
      if (timePeriod === "month") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }
      if (timePeriod === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [invoices, timePeriod]);

  // Search-filtered invoices for the table
  const displayedInvoices = useMemo(() => {
    if (!searchQuery.trim()) return periodFilteredInvoices;
    const q = searchQuery.toLowerCase();
    return periodFilteredInvoices.filter(
      (inv) =>
        inv.charterName?.toLowerCase().includes(q) ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.billingContact?.toLowerCase().includes(q) ||
        inv.billingEmail?.toLowerCase().includes(q)
    );
  }, [periodFilteredInvoices, searchQuery]);

  // Stats (based on period filtered)
  const totalInvoices = periodFilteredInvoices.length;
  const paidInvoices = periodFilteredInvoices.filter(
    (i) => i.paymentStatus === "Paid"
  );
  const unpaidInvoices = periodFilteredInvoices.filter(
    (i) => i.paymentStatus === "Unpaid"
  );
  const pendingInvoices = periodFilteredInvoices.filter(
    (i) => i.paymentStatus === "Pending"
  );
  const totalInvoiced = periodFilteredInvoices.reduce(
    (sum, i) => sum + i.totalAmount,
    0
  );
  const totalCollected = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOutstanding = [...unpaidInvoices, ...pendingInvoices].reduce(
    (sum, i) => sum + i.totalAmount,
    0
  );

  // Monthly totals for the chart (last 12 months, all-time data)
  const monthlyTotals = useMemo(() => {
    const months: { label: string; total: number; paid: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthInvoices = invoices.filter((inv) => {
        if (!inv.createdTime) return false;
        const id = new Date(inv.createdTime);
        return id.getFullYear() === year && id.getMonth() === month;
      });
      const total = monthInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const paid = monthInvoices
        .filter((i) => i.paymentStatus === "Paid")
        .reduce((s, i) => s + i.totalAmount, 0);
      months.push({ label, total, paid });
    }
    return months;
  }, [invoices]);

  const maxMonthlyTotal = Math.max(...monthlyTotals.map((m) => m.total), 1);

  const statusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "Refunded":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusBadge = (status: PaymentStatus) => {
    const colors: Record<string, string> = {
      Paid: "bg-green-50 text-green-700 border-green-200",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Unpaid: "bg-slate-50 text-slate-600 border-slate-200",
      Refunded: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.Unpaid}`}
      >
        {statusIcon(status)}
        {status}
      </span>
    );
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyPayLink(invoiceId: string) {
    const url = `${window.location.origin}/pay/${invoiceId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invoiceId);
      setTimeout(() => setCopiedId((id) => (id === invoiceId ? null : id)), 1500);
    } catch {
      window.prompt("Copy payment link:", url);
    }
  }

  async function handleStatusChange(invoiceId: string, newStatus: PaymentStatus) {
    try {
      const paidAt = newStatus === "Paid" ? new Date().toISOString() : undefined;
      await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          paymentStatus: newStatus,
          ...(paidAt && { paidAt }),
        }),
      });
      fetchInvoices();
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-americana-blue/10 rounded-xl">
              <Receipt className="w-6 h-6 text-americana-blue" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Billing & Invoices
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Charter invoices, payment tracking, and billing management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/billing/documents"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Vendor Docs
          </Link>
          <button
            onClick={fetchInvoices}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              fetchCharters();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-americana-blue rounded-xl hover:bg-americana-blue-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Time Period Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["month", "year", "all"] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              timePeriod === period
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {period === "month" ? "This Month" : period === "year" ? "This Year" : "All Time"}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total Invoiced</p>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {totalInvoices} invoice{totalInvoices !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Collected</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-700 mt-2">
            ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {paidInvoices.length} paid
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Outstanding</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {unpaidInvoices.length + pendingInvoices.length} unpaid
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Collection Rate</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalInvoiced > 0
              ? Math.round((totalCollected / totalInvoiced) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-slate-400 mt-1">
            of total invoiced
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-americana-blue" />
          <h2 className="font-semibold text-slate-900">Monthly Revenue</h2>
          <span className="text-xs text-slate-400">(Last 12 months)</span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {monthlyTotals.map((m, i) => {
            const totalHeight = (m.total / maxMonthlyTotal) * 100;
            const paidHeight = (m.paid / maxMonthlyTotal) * 100;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 group"
              >
                <div className="w-full h-full flex items-end relative">
                  {m.total > 0 && (
                    <div
                      className="w-full bg-slate-200 rounded-t relative"
                      style={{ height: `${totalHeight}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-americana-blue rounded-t"
                        style={{
                          height: `${
                            m.total > 0 ? (paidHeight / totalHeight) * 100 : 0
                          }%`,
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap">
                          <div>Total: ${m.total.toLocaleString()}</div>
                          <div>Paid: ${m.paid.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-americana-blue rounded-sm" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-200 rounded-sm" />
            <span>Invoiced</span>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by school, invoice #, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PaymentStatus | "")
            }
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
          >
            <option value="">All Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : displayedInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">
              {searchQuery || timePeriod !== "all"
                ? "No matching invoices"
                : "No invoices yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery || timePeriod !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    School
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Billing Contact
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Payer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Method
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {inv.charterName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{inv.billingContact}</div>
                      <div className="text-xs text-slate-400">
                        {inv.billingEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inv.payerType}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inv.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ${inv.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(inv.paymentStatus)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {inv.createdTime
                        ? new Date(inv.createdTime).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Download PDF (invoice only) */}
                        <a
                          href={`/api/reports/invoice?invoiceId=${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-americana-blue"
                          title="Download Invoice PDF"
                          aria-label={`Download invoice PDF for ${inv.invoiceNumber}`}
                        >
                          <Download className="w-4 h-4" aria-hidden="true" />
                        </a>
                        {/* Download Payment Package (invoice + vendor docs) */}
                        <a
                          href={`/api/reports/payment-package?invoiceId=${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          title="Download Payment Package (invoice + vendor docs)"
                          aria-label={`Download payment package for ${inv.invoiceNumber}`}
                        >
                          <Package className="w-4 h-4" aria-hidden="true" />
                        </a>
                        {/* Copy payment link */}
                        <button
                          onClick={() => copyPayLink(inv.id)}
                          disabled={inv.paymentStatus === "Paid"}
                          className="p-1.5 text-slate-400 hover:text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-americana-blue disabled:opacity-40 disabled:hover:bg-transparent"
                          title={copiedId === inv.id ? "Copied!" : "Copy payment link"}
                          aria-label={copiedId === inv.id ? `Copied link for ${inv.invoiceNumber}` : `Copy payment link for ${inv.invoiceNumber}`}
                        >
                          {copiedId === inv.id ? (
                            <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                          ) : (
                            <LinkIcon className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                        {/* Pay Now opens hosted Stripe checkout via /pay page */}
                        <a
                          href={inv.paymentStatus === "Paid" ? undefined : `/pay/${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={inv.paymentStatus === "Paid"}
                          className={`p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] ${
                            inv.paymentStatus === "Paid"
                              ? "text-slate-300 pointer-events-none"
                              : "text-slate-400 hover:text-[#C62828] hover:bg-red-50"
                          }`}
                          title="Open payment page"
                          aria-label={`Open payment page for ${inv.invoiceNumber}`}
                        >
                          <CreditCard className="w-4 h-4" aria-hidden="true" />
                        </a>
                        {/* Status dropdown */}
                        <select
                          value={inv.paymentStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              inv.id,
                              e.target.value as PaymentStatus
                            )
                          }
                          aria-label={`Change payment status for ${inv.invoiceNumber}`}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          charters={charters}
          chartersLoading={chartersLoading}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Create Invoice Modal
// ============================================================

function CreateInvoiceModal({
  charters,
  chartersLoading,
  onClose,
  onCreated,
}: {
  charters: CharterOption[];
  chartersLoading: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedCharter, setSelectedCharter] = useState<CharterOption | null>(null);
  const [charterSearch, setCharterSearch] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [payerType, setPayerType] = useState<PayerType>("Teacher");
  const [aeuType, setAeuType] = useState<AEUType>("School District");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Credit Card");
  const [teamCount, setTeamCount] = useState(1);
  const [taxExempt, setTaxExempt] = useState(false);
  const [taxExemptNumber, setTaxExemptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCharterPicker, setShowCharterPicker] = useState(false);

  const totalAmount = teamCount * CHARTER_FEE;

  const filteredCharters = charters.filter(
    (c) =>
      c.name.toLowerCase().includes(charterSearch.toLowerCase()) ||
      c.state.toLowerCase().includes(charterSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCharter) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charterId: selectedCharter.id,
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
        }),
      });
      const json = await res.json();
      if (json.success) {
        onCreated();
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            Create New Invoice
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Charter Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              School (Charter) *
            </label>
            {selectedCharter ? (
              <div className="flex items-center justify-between p-3 bg-americana-blue/5 border border-americana-blue/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedCharter.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedCharter.city}, {selectedCharter.state} —{" "}
                    {selectedCharter.teamCount} team
                    {selectedCharter.teamCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCharter(null);
                    setShowCharterPicker(true);
                  }}
                  className="text-sm text-americana-blue hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={charterSearch}
                  onChange={(e) => {
                    setCharterSearch(e.target.value);
                    setShowCharterPicker(true);
                  }}
                  onFocus={() => setShowCharterPicker(true)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
                />
                {showCharterPicker && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {chartersLoading ? (
                      <div className="p-4 text-center text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      </div>
                    ) : filteredCharters.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">
                        No schools found
                      </div>
                    ) : (
                      filteredCharters.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCharter(c);
                            setTeamCount(c.teamCount || 1);
                            setShowCharterPicker(false);
                            setCharterSearch("");
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.city}, {c.state} — {c.teamCount} team
                            {c.teamCount !== 1 ? "s" : ""}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Billing Contact *
              </label>
              <input
                type="text"
                required
                value={billingContact}
                onChange={(e) => setBillingContact(e.target.value)}
                placeholder="Contact name"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@school.edu"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={billingPhone}
                onChange={(e) => setBillingPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payer Type *
              </label>
              <select
                required
                value={payerType}
                onChange={(e) => setPayerType(e.target.value as PayerType)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              >
                {PAYER_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AEU Type & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Administrative Educational Unit *
              </label>
              <select
                required
                value={aeuType}
                onChange={(e) => setAeuType(e.target.value as AEUType)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              >
                {AEU_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                required
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Count & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Number of Teams
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={teamCount}
                onChange={(e) =>
                  setTeamCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              />
              <p className="text-xs text-slate-400 mt-1">
                ${CHARTER_FEE} per team charter
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Amount
              </label>
              <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-americana-blue">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Tax Exempt */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-americana-blue focus:ring-americana-blue/20"
              />
              <span className="text-sm font-medium text-slate-700">
                Tax Exempt
              </span>
            </label>
            {taxExempt && (
              <input
                type="text"
                value={taxExemptNumber}
                onChange={(e) => setTaxExemptNumber(e.target.value)}
                placeholder="Tax exempt number"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes for this invoice..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue/20 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCharter || submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-americana-blue rounded-xl hover:bg-americana-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Create Invoice"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
