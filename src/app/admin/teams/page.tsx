"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  School,
  MapPin,
  ExternalLink,
  Loader2,
  Filter,
  Trash2,
  X,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  schoolName?: string;
  schoolId?: string;
  division: string;
  state?: string;
  coach?: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newTeam, setNewTeam] = useState({
    name: "",
    state: "",
    division: "HSBBQ",
    coach: "",
  });

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (json.success && json.data) {
        setTeams(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        setNewTeam({ name: "", state: "", division: "HSBBQ", coach: "" });
        fetchTeams();
      } else {
        alert("Failed to create team: " + json.error);
      }
    } catch (err) {
      console.error("Error creating team:", err);
      alert("Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/teams?id=${teamId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setDeleteConfirm(null);
        fetchTeams();
      } else {
        alert("Failed to delete team: " + json.error);
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      alert("Failed to delete team");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === "" ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivision =
      divisionFilter === "all" || team.division === divisionFilter;
    return matchesSearch && matchesDivision;
  });

  const getDivisionBadge = (division: string) => {
    if (division === "HSBBQ") {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-americana-blue/10 text-americana-blue">
          HSBBQ
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brisket-brown/10 text-brisket-brown">
        MSBBQ
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-500 mt-1">
            Manage BBQ competition teams
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-americana-blue text-white rounded-xl font-medium text-sm hover:bg-americana-blue/90 transition-colors shadow-lg shadow-americana-blue/25"
        >
          <Plus className="w-4 h-4" />
          Add Team
        </button>
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
              placeholder="Search teams..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Division Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="appearance-none pl-9 pr-10 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-700 text-sm font-medium cursor-pointer"
            >
              <option value="all">All Divisions</option>
              <option value="HSBBQ">High School (HSBBQ)</option>
              <option value="MSBBQ">Middle School (MSBBQ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-americana-blue mb-3" />
            <p className="text-slate-500 text-sm">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No teams found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery || divisionFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first team to get started"}
            </p>
            {!searchQuery && divisionFilter === "all" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Team
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    School
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    State
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brisket-brown to-brisket-brown-light flex items-center justify-center text-white">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {team.name}
                          </p>
                          {team.coach && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Coach: {team.coach}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {team.schoolName ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <School className="w-4 h-4" />
                          {team.schoolName}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {team.state ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          {team.state}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getDivisionBadge(team.division)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/teams/${team.id}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View team"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(team.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {filteredTeams.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Showing {filteredTeams.length} of {teams.length} teams
        </p>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add New Team</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue"
                  placeholder="e.g., Smokin' Rebels"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={newTeam.state}
                  onChange={(e) => setNewTeam({ ...newTeam, state: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue"
                  placeholder="e.g., TX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Division
                </label>
                <select
                  value={newTeam.division}
                  onChange={(e) => setNewTeam({ ...newTeam, division: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue"
                >
                  <option value="HSBBQ">High School (HSBBQ)</option>
                  <option value="MSBBQ">Middle School (MSBBQ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Coach / Advisor
                </label>
                <input
                  type="text"
                  value={newTeam.coach}
                  onChange={(e) => setNewTeam({ ...newTeam, coach: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue"
                  placeholder="Coach name"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-americana-blue text-white rounded-xl font-medium hover:bg-americana-blue/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Team?</h2>
            <p className="text-slate-500 mb-6">
              This action cannot be undone. This will permanently delete the team from Airtable.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(deleteConfirm)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
