"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  School,
  MapPin,
  Users,
  ExternalLink,
  Loader2,
  Filter,
} from "lucide-react";

interface SchoolItem {
  id: string;
  name: string;
  city: string;
  state: string;
  district?: string;
  logoUrl?: string;
  teams?: string[];
}

export default function AdminChartersPage() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");

  async function fetchSchools() {
    try {
      const res = await fetch("/api/schools");
      const json = await res.json();
      if (json.success && json.data) {
        setSchools(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchools();
  }, []);

  // Get unique states for the filter dropdown
  const states = Array.from(new Set(schools.map((s) => s.state).filter(Boolean))).sort();

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      searchQuery === "" ||
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState =
      stateFilter === "all" || school.state === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-500 mt-1">
            {schools.length} chartered school{schools.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schools..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* State Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="appearance-none pl-9 pr-10 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-700 text-sm font-medium cursor-pointer"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schools List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-americana-blue mb-3" />
            <p className="text-slate-500 text-sm">Loading schools...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <School className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No schools found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery || stateFilter !== "all"
                ? "Try adjusting your filters"
                : "Schools are managed in Airtable"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    City
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    State
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSchools.map((school) => (
                  <tr
                    key={school.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-americana-blue to-[#1e2a5e] flex items-center justify-center text-white">
                          <School className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {school.name}
                          </p>
                          {school.district && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {school.district}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {school.city ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          {school.city}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {school.state ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-americana-blue/10 text-americana-blue">
                          {school.state}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        {school.teams?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/schools/${school.id}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View school"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Note */}
      {filteredSchools.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Showing {filteredSchools.length} of {schools.length} schools
        </p>
      )}
    </div>
  );
}
