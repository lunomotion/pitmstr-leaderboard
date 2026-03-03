"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Search,
  Loader2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

interface TurnIn {
  id: string;
  teamName: string;
  eventName: string;
  category: string;
  judgeId: string;
  scores: { M: number; E: number; A: number; T: number };
  weightedScore: number;
  submittedAt: string;
  notes?: string;
}

export default function TurnInsPage() {
  const [turnIns, setTurnIns] = useState<TurnIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchTurnIns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/turn-ins");
      const json = await res.json();
      if (json.success) {
        setTurnIns(json.data || []);
      } else {
        setError(json.error || "Failed to load turn-ins");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTurnIns();
  }, []);

  const filtered = turnIns.filter(
    (t) =>
      !search ||
      t.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      t.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.judgeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turn-Ins</h1>
          <p className="text-slate-500 mt-1">
            Judge score submissions from QR code scanning
          </p>
        </div>
        <button
          onClick={fetchTurnIns}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchTurnIns}
              className="mt-3 text-sm text-americana-blue hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Trophy className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No turn-ins yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Scores will appear here when judges submit via QR code
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
                    M
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    E
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    A
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-slate-500">
                    T
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">
                    Weighted
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.teamName || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.eventName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.judgeId}</td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {t.scores.M}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {t.scores.E}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {t.scores.A}
                    </td>
                    <td className="text-center px-3 py-3 font-mono text-slate-700">
                      {t.scores.T}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-semibold text-americana-blue">
                        {t.weightedScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {t.submittedAt
                        ? new Date(t.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        M.E.A.T. Scoring: Mise en Place (10%) · Execution (50%) · Appearance
        (20%) · Texture (20%)
      </p>
    </div>
  );
}
