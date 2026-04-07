"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, RefreshCw } from "lucide-react";

interface DivisionRecord {
  id: string;
  name: string;
  code?: string;
  gradeRange?: string;
  ageRange?: string;
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<DivisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDivisions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lookups?table=divisions");
      const json = await res.json();
      if (json.success) setDivisions(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDivisions();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Divisions</h1>
          <p className="text-slate-500 mt-1">
            Competition divisions (K-20) — Kids Que through Mentor BBQ
          </p>
        </div>
        <button
          onClick={fetchDivisions}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : divisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Layers className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No divisions configured</p>
            <p className="text-sm text-slate-400 mt-1">
              Add divisions in Airtable to see them here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Division Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Grade Range
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Age Range
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Record ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {divisions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {d.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.code || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.gradeRange || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.ageRange || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {d.id}
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
