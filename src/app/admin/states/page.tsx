"use client";

import { useEffect, useState } from "react";
import { Map, Loader2, RefreshCw } from "lucide-react";

interface StateRecord {
  id: string;
  name: string;
  abbreviation: string;
}

export default function StatesPage() {
  const [states, setStates] = useState<StateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchStates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lookups?table=states");
      const json = await res.json();
      if (json.success) setStates(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStates();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">States</h1>
          <p className="text-slate-500 mt-1">
            Registered state associations from Airtable
          </p>
        </div>
        <button
          onClick={fetchStates}
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
        ) : states.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Map className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No states configured</p>
            <p className="text-sm text-slate-400 mt-1">
              Add states in Airtable to see them here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Abbreviation
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    State Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">
                    Record ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {states.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 bg-americana-blue/10 text-americana-blue rounded-md text-xs font-bold">
                        {s.abbreviation}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {s.id}
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
