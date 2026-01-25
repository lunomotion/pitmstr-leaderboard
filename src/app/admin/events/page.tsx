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
        const data = await res.json();
        setEvents(data);
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
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-bbq-red text-white">
            Live
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-medium-grey text-white">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-green text-white">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-smoke-black">Events</h1>
          <p className="text-medium-grey mt-1">
            Manage competition events and schedules
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="btn-primary inline-flex items-center gap-2 self-start"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-card-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-medium-grey" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-card-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-americana-blue" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-neutral-grey mx-auto mb-3" />
            <p className="text-medium-grey">No events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-grey border-b border-card-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-smoke-black">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-smoke-black">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-smoke-black hidden md:table-cell">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-smoke-black hidden lg:table-cell">
                    Division
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-smoke-black">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-smoke-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-light-grey/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-smoke-black">
                        {event.name}
                      </div>
                      {event.registeredTeams !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-medium-grey mt-1">
                          <Users className="w-3 h-3" />
                          {event.registeredTeams} teams
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-smoke-black">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-medium-grey hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location || "TBD"}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="division-badge hsbbq">
                        {event.division}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(event.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="px-3 py-1.5 text-sm font-medium text-americana-blue hover:bg-americana-blue/10 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/leaderboard/${event.id}`}
                          target="_blank"
                          className="p-1.5 text-medium-grey hover:text-smoke-black transition-colors"
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

      {/* Info Note */}
      <p className="text-sm text-medium-grey text-center">
        Events are synced with Airtable. Changes made here will update your Airtable base.
      </p>
    </div>
  );
}
