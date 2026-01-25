"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import DivisionFilter from "@/components/DivisionFilter";
import DivisionBadge from "@/components/DivisionBadge";
import { Users, Loader2, Filter, ChevronRight, School, MapPin, Plus, X, Trash2 } from "lucide-react";
import type { Team, Division } from "@/lib/types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<Division | "all">("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    state: "",
    division: "HSBBQ",
    coach: "",
  });

  // Get unique states from teams
  const availableStates = useMemo(() => {
    const states = new Set(teams.map(t => t.state).filter(Boolean));
    return Array.from(states).sort() as string[];
  }, [teams]);

  async function fetchTeams() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/teams");
      const data = await response.json();

      if (data.success && data.data) {
        setTeams(data.data);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setIsLoading(false);
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
      const res = await fetch(`/api/teams?id=${teamId}`, { method: "DELETE" });
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

  // Filter teams
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          team.name.toLowerCase().includes(query) ||
          (team.schoolName && team.schoolName.toLowerCase().includes(query)) ||
          (team.state && team.state.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Division filter
      if (selectedDivision !== "all" && team.division !== selectedDivision) {
        return false;
      }

      // State filter
      if (selectedState !== "all" && team.state !== selectedState) {
        return false;
      }

      return true;
    });
  }, [teams, searchQuery, selectedDivision, selectedState]);

  // Group teams by state
  const teamsByState = useMemo(() => {
    const grouped: Record<string, Team[]> = {};
    filteredTeams.forEach((team) => {
      const state = team.state || "Unknown";
      if (!grouped[state]) grouped[state] = [];
      grouped[state].push(team);
    });
    return grouped;
  }, [filteredTeams]);

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-smoke-black to-brisket-brown text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              TEAMS
            </h1>
            <p className="text-white/70">
              Browse BBQ teams from schools across the nation
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bbq-red text-white rounded-xl font-medium text-sm hover:bg-bbq-red/90 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Team
          </button>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b border-card-border sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="space-y-4">
            <SearchInput
              placeholder="Search teams by name, school, or state..."
              onSearch={setSearchQuery}
            />

            <div className="flex flex-wrap gap-4 items-center">
              <DivisionFilter
                selectedDivision={selectedDivision}
                onDivisionChange={setSelectedDivision}
              />

              {/* State Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-medium-grey" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-card-border bg-white text-smoke-black focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                >
                  <option value="all">All States</option>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
            <p className="text-smoke-black font-semibold">Loading teams...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Teams by State */}
            {Object.keys(teamsByState).length > 0 ? (
              Object.entries(teamsByState)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([state, stateTeams]) => (
                  <section key={state} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-americana-blue" />
                      <h2
                        className="text-xl font-bold text-smoke-black"
                        style={{ fontFamily: "var(--font-oswald)" }}
                      >
                        {state} ({stateTeams.length})
                      </h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {stateTeams.map((team) => (
                        <div
                          key={team.id}
                          className="bg-white rounded-xl border border-card-border p-4 hover:shadow-lg hover:-translate-y-1 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <Link href={`/teams/${team.id}`} className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <DivisionBadge division={team.division} size="sm" />
                              </div>
                              <h3
                                className="font-bold text-smoke-black text-lg truncate group-hover:text-bbq-red transition-colors"
                                style={{ fontFamily: "var(--font-oswald)" }}
                              >
                                {team.name}
                              </h3>
                              {team.schoolName && (
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-medium-grey">
                                  <School className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{team.schoolName}</span>
                                </div>
                              )}
                              {team.coach && (
                                <p className="text-xs text-medium-grey mt-1">
                                  Coach: {team.coach}
                                </p>
                              )}
                            </Link>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setDeleteConfirm(team.id)}
                                className="p-2 text-neutral-grey hover:text-bbq-red hover:bg-bbq-red/10 rounded-lg transition-colors"
                                title="Delete team"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <Link href={`/teams/${team.id}`}>
                                <ChevronRight className="w-5 h-5 text-neutral-grey group-hover:text-bbq-red transition-colors flex-shrink-0" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-card-border">
                <Users className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
                <p className="text-smoke-black font-semibold">No teams found</p>
                <p className="text-medium-grey text-sm mt-1">
                  Try adjusting your filters
                </p>
              </div>
            )}

            {/* Results count */}
            {filteredTeams.length > 0 && (
              <p className="text-center text-sm text-medium-grey mt-8">
                Showing {filteredTeams.length} of {teams.length} teams
              </p>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-smoke-black text-white py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p
            className="text-sm text-white/80 font-semibold tracking-wider mb-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            EDUCATION. BARBECUE. FAMILY.
          </p>
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} NHSBBQA&reg;. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-smoke-black">Add New Team</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-light-grey rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                  placeholder="e.g., Smokin' Rebels"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={newTeam.state}
                  onChange={(e) => setNewTeam({ ...newTeam, state: e.target.value })}
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                  placeholder="e.g., TX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Division
                </label>
                <select
                  value={newTeam.division}
                  onChange={(e) => setNewTeam({ ...newTeam, division: e.target.value })}
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                >
                  <option value="HSBBQ">High School (HSBBQ)</option>
                  <option value="MSBBQ">Middle School (MSBBQ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Coach / Advisor
                </label>
                <input
                  type="text"
                  value={newTeam.coach}
                  onChange={(e) => setNewTeam({ ...newTeam, coach: e.target.value })}
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                  placeholder="Coach name"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-card-border rounded-xl font-medium text-smoke-black hover:bg-light-grey"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-bbq-red text-white rounded-xl font-medium hover:bg-bbq-red/90 disabled:opacity-50"
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
            <div className="w-14 h-14 rounded-full bg-bbq-red/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-bbq-red" />
            </div>
            <h2 className="text-xl font-bold text-smoke-black mb-2">Delete Team?</h2>
            <p className="text-medium-grey mb-6">
              This action cannot be undone. This will permanently delete the team.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-card-border rounded-xl font-medium text-smoke-black hover:bg-light-grey"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTeam(deleteConfirm)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-bbq-red text-white rounded-xl font-medium hover:bg-bbq-red/90 disabled:opacity-50"
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
