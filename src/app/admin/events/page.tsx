"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Loader2,
  Filter,
  MoreHorizontal,
} from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  state: string;
  division: string;
  status: "upcoming" | "live" | "completed";
  registeredTeams?: number;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const json = await res.json();
        // API returns { success: true, data: events }
        if (json.success && json.data) {
          setEvents(json.data);
        } else {
          console.error("Failed to fetch events:", json.error);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-100">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 mt-1">
            Manage competition events and schedules
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-americana-blue text-white rounded-xl font-medium text-sm hover:bg-americana-blue/90 transition-colors shadow-lg shadow-americana-blue/25"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
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
              placeholder="Search events..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-9 pr-10 py-2.5 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue text-slate-700 text-sm font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-americana-blue mb-3" />
            <p className="text-slate-500 text-sm">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No events found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first event to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link
                href="/admin/events/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Division
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-americana-blue to-[#1e2a5e] flex items-center justify-center text-white">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {event.name}
                          </p>
                          {event.registeredTeams !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Users className="w-3.5 h-3.5" />
                              {event.registeredTeams} teams registered
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        {event.location || "TBD"}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg bg-americana-blue/10 text-americana-blue">
                        {event.division}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(event.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-americana-blue hover:bg-americana-blue/5 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/leaderboard/${event.id}`}
                          target="_blank"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View leaderboard"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
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
      {filteredEvents.length > 0 && (
        <p className="text-center text-sm text-slate-400">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      )}
    </div>
  );
}
