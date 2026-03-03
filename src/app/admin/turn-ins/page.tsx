"use client";

import { useEffect, useState } from "react";
import { Package, Search, Loader2, RefreshCw, Camera } from "lucide-react";

interface TurnIn {
  id: string;
  name: string;
  teamName: string;
  eventName: string;
  category: string;
  turnInTime: string | null;
  scorecardCount: number;
  notes: string;
  hasPhoto: boolean;
}

export default function TurnInsPage() {
  const [turnIns, setTurnIns] = useState<TurnIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchData() {
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
    fetchData();
  }, []);

  const filtered = turnIns.filter(
    (t) =>
      !search ||
      t.teamName?.toLowerCase().includes(search.toLowerCase()) ||
      t.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turn-Ins</h1>
          <p className="text-slate-500 mt-1">
            {loading
              ? "Loading..."
              : `${turnIns.length} box submission${turnIns.length !== 1 ? "s" : ""}`}
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
          placeholder="Search by team, event, or category..."
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
            <Package className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No turn-ins yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Box submissions will appear here during events
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
                    Turn-In Time
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">
                    Photo
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-slate-500">
                    Scorecards
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.teamName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.eventName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.turnInTime
                        ? new Date(t.turnInTime).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="text-center px-4 py-3">
                      {t.hasPhoto ? (
                        <Camera className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3">
                      <span className="font-semibold text-americana-blue">
                        {t.scorecardCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                      {t.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
