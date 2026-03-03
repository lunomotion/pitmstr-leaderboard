"use client";

import { HandHeart, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface VolunteerRecord {
  id: string;
  [key: string]: unknown;
}

export default function VolunteersPage() {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<VolunteerRecord[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/entities?table=Volunteers")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRecords(json.data);
          setFields(json.fields);
        } else {
          setError(json.error || "Failed to load volunteers");
        }
      })
      .catch(() => setError("Failed to load volunteers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(
      (v) => typeof v === "string" && v.toLowerCase().includes(q)
    );
  });

  const displayFields = fields.filter(
    (f) => !f.startsWith("_") && f !== "id"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Volunteers</h1>
          <p className="text-slate-500 mt-1">
            {loading
              ? "Loading..."
              : `${records.length} volunteer${records.length !== 1 ? "s" : ""} registered`}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search volunteers..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Loading volunteers...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <HandHeart className="w-12 h-12 text-red-300 mb-3" />
            <p className="text-red-600 font-medium">
              Error loading volunteers
            </p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <HandHeart className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">
              {search ? "No matching volunteers" : "No volunteers yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {displayFields.map((f) => (
                    <th
                      key={f}
                      className="text-left px-4 py-3 font-semibold text-slate-600"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    {displayFields.map((f) => (
                      <td key={f} className="px-4 py-3 text-slate-700">
                        {formatCell(r[f])}
                      </td>
                    ))}
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

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
