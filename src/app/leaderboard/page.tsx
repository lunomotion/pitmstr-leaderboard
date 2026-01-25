"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SearchInput from "@/components/SearchInput";
import DivisionFilter from "@/components/DivisionFilter";
import DivisionBadge from "@/components/DivisionBadge";
import { Trophy, Loader2, Flame, Calendar, MapPin, ChevronRight } from "lucide-react";
import type { Event, Division, EventStatus } from "@/lib/types";

export default function LeaderboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<Division | "all">("all");

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/events");
        const data = await response.json();

        if (data.success && data.data) {
          setEvents(data.data);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.state.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Division filter
      if (selectedDivision !== "all" && event.division !== selectedDivision) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedDivision]);

  // Separate live and other events
  const liveEvents = filteredEvents.filter((e) => e.status === "live");
  const completedEvents = filteredEvents.filter((e) => e.status === "completed");
  const upcomingEvents = filteredEvents.filter((e) => e.status === "upcoming");

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const EventLeaderboardCard = ({ event }: { event: Event }) => (
    <Link
      href={`/leaderboard/${event.id}`}
      className="bg-white rounded-xl border border-card-border p-4 hover:shadow-lg hover:-translate-y-1 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status and Division */}
          <div className="flex items-center gap-2 mb-2">
            {event.status === "live" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bbq-red text-white rounded text-xs font-semibold animate-pulse">
                <Flame className="w-3 h-3" />
                LIVE
              </span>
            )}
            <DivisionBadge division={event.division} size="sm" />
          </div>

          {/* Event Name */}
          <h3
            className="font-bold text-smoke-black text-lg truncate group-hover:text-bbq-red transition-colors"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {event.name}
          </h3>

          {/* Event Details */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-medium-grey">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>
                {event.city}, {event.state}
              </span>
            </div>
          </div>

          {/* Team count */}
          {event.registeredTeams && (
            <p className="text-xs text-medium-grey mt-2">
              {event.registeredTeams} teams registered
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-grey group-hover:text-bbq-red transition-colors" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-smoke-black via-americana-blue to-smoke-black text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-gold" />
            <h1
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              LEADERBOARDS
            </h1>
          </div>
          <p className="text-white/70">
            View live scores and rankings from BBQ competitions
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b border-card-border sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                placeholder="Search events..."
                onSearch={setSearchQuery}
              />
            </div>
            <DivisionFilter
              selectedDivision={selectedDivision}
              onDivisionChange={setSelectedDivision}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
            <p className="text-smoke-black font-semibold">Loading leaderboards...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Live Events */}
            {liveEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-bbq-red animate-pulse" />
                  <h2
                    className="text-xl font-bold text-smoke-black"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    LIVE NOW
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveEvents.map((event) => (
                    <EventLeaderboardCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Events */}
            {completedEvents.length > 0 && (
              <section className="mb-8">
                <h2
                  className="text-xl font-bold text-smoke-black mb-4"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  COMPLETED EVENTS
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedEvents.map((event) => (
                    <EventLeaderboardCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="mb-8">
                <h2
                  className="text-xl font-bold text-smoke-black mb-4"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  UPCOMING EVENTS
                </h2>
                <p className="text-medium-grey text-sm mb-4">
                  Leaderboards will be available when events go live
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventLeaderboardCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-card-border">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
                <p className="text-smoke-black font-semibold">No leaderboards found</p>
                <p className="text-medium-grey text-sm mt-1">
                  Try adjusting your filters
                </p>
              </div>
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
    </div>
  );
}
