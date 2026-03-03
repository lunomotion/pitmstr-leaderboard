"use client";

import { Award, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function SponsorsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsors</h1>
          <p className="text-slate-500 mt-1">
            Manage event and organizational sponsors
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-americana-blue text-white rounded-xl font-medium text-sm hover:bg-americana-blue/90 transition-colors shadow-lg shadow-americana-blue/25">
          <Plus className="w-4 h-4" />
          Add Sponsor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sponsors..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16">
          <Award className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No sponsors yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Sponsor partnerships will be tracked here
          </p>
        </div>
      </div>
    </div>
  );
}
