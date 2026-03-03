"use client";

import { useEffect, useState } from "react";
import { Grid3X3, Loader2, RefreshCw } from "lucide-react";

interface CategoryRecord {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lookups?table=categories");
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500 mt-1">
            Food categories used in competition scoring
          </p>
        </div>
        <button
          onClick={fetchCategories}
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
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Grid3X3 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No categories configured</p>
            <p className="text-sm text-slate-400 mt-1">
              Add food categories in Airtable to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-slate-900">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
