"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Loader2, RefreshCw } from "lucide-react";

interface Scorecard {
  id: string;
  name: string;
  teamName: string;
  eventName: string;
  category: string;
  judgeName: string;
  scores: { M: number; E: number; A: number; T: number };
  totalScore: number;
  totalPenalty: number;
}

export default function ReportCardsPage() {
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scorecards");
      const json = await res.json();
      if (json.success) {
        setCards(json.data || []);
      } else {
        setError(json.error || "Failed to load scorecards");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = cards.filter(
    (c) =>
      !search ||
      c.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      c.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.judgeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Scorecards
          </h1>
          <p className="text-slate-500 mt-1">
            {loading
              ? "Loading..."
              : `${cards.length} judge scorecard${cards.length !== 1 ? "s" : ""} — M.E.A.T. scoring`}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by team, event, category, or judge..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 text-sm text-americana-blue hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No scorecards yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Judge scores will appear here when submitted via QR code
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Team
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Judge
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    <span title="Mis En Place (out of 10)">M /10</span>
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    <span title="Taste (out of 55)">E /55</span>
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    <span title="Appearance (out of 15)">A /15</span>
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    <span title="Texture (out of 20)">T /20</span>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c.teamName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.eventName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.judgeName}</td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {c.scores.M}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {c.scores.E}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {c.scores.A}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {c.scores.T}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-semibold text-americana-blue">
                        {c.totalScore}
                      </span>
                      <span className="text-slate-400 text-xs"> /100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        M.E.A.T. Scoring: Mis En Place (10 pts) · Taste (55 pts) · Appearance
        (15 pts) · Texture (20 pts) · Total: 100
      </p>
    </div>
  );
}
