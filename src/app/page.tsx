"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import SearchInput from "@/components/SearchInput";
import DivisionFilter from "@/components/DivisionFilter";
import { Flame, Calendar, Trophy, Users, Loader2, MapPin, School } from "lucide-react";
import type { Event, Division, EventStatus } from "@/lib/types";

// Sample events for display when no Airtable data
const SAMPLE_EVENTS: Event[] = [
  {
    id: "sample_1",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Texas State Championship",
    date: new Date().toISOString().split('T')[0], // Today - LIVE
    location: "Fort Worth, TX",
    city: "Fort Worth",
    state: "TX",
    division: "HSBBQ",
    status: "live",
    description: "The biggest high school BBQ competition in Texas featuring teams from across the Lone Star State.",
    registeredTeams: 48,
    categories: ["Brisket", "Ribs", "Chicken"],
  },
  {
    id: "sample_2",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Oklahoma Smoke Showdown",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
    location: "Oklahoma City, OK",
    city: "Oklahoma City",
    state: "OK",
    division: "HSBBQ",
    status: "upcoming",
    description: "Annual showdown featuring top teams from Oklahoma and surrounding states.",
    registeredTeams: 32,
    categories: ["Brisket", "Pork", "Chicken"],
  },
  {
    id: "sample_3",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Kansas City BBQ Classic",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks
    location: "Kansas City, MO",
    city: "Kansas City",
    state: "MO",
    division: "HSBBQ",
    status: "upcoming",
    description: "The heartland's premier high school BBQ event in the BBQ capital of the world.",
    registeredTeams: 56,
    categories: ["Brisket", "Ribs", "Chicken", "Pork"],
  },
  {
    id: "sample_4",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Georgia Peach Pit Masters",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks
    location: "Atlanta, GA",
    city: "Atlanta",
    state: "GA",
    division: "MSBBQ",
    status: "upcoming",
    description: "Middle school teams compete in this Southern classic featuring Georgia's finest young pitmasters.",
    registeredTeams: 24,
    categories: ["Chicken", "Ribs", "Pork"],
  },
  {
    id: "sample_5",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Lone Star Smoke Show",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last week
    location: "Austin, TX",
    city: "Austin",
    state: "TX",
    division: "HSBBQ",
    status: "completed",
    description: "Austin's annual celebration of high school BBQ talent, completed with record attendance.",
    registeredTeams: 40,
    categories: ["Brisket", "Ribs", "Chicken"],
  },
];

interface Stats {
  events: number;
  teams: number;
  schools: number;
  states: number;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({ events: 0, teams: 0, schools: 0, states: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<Division | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | "all">("all");

  // Fetch events and stats from API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch events
        const eventsResponse = await fetch("/api/events");
        const eventsData = await eventsResponse.json();

        if (eventsData.success && eventsData.data && eventsData.data.length > 0) {
          setEvents(eventsData.data);
        } else {
          setEvents(SAMPLE_EVENTS);
        }

        // Fetch stats
        const statsResponse = await fetch("/api/stats");
        const statsData = await statsResponse.json();

        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setEvents(SAMPLE_EVENTS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
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

      // Status filter
      if (selectedStatus !== "all" && event.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedDivision, selectedStatus]);

  // Separate live events
  const liveEvents = filteredEvents.filter((e) => e.status === "live");
  const otherEvents = filteredEvents.filter((e) => e.status !== "live");

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-americana-blue via-americana-blue-light to-white/90 text-white py-10 md:py-16 px-4 overflow-hidden">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-americana-blue/20 to-white/30" />

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Logos Section */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
              <Image
                src="/images/nhsbbqa-logo.png"
                alt="NHSBBQA Logo"
                width={200}
                height={140}
                className="h-24 md:h-32 w-auto"
                priority
              />
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
              <Image
                src="/images/pitmstr-flame.png"
                alt="PITMSTR Logo"
                width={120}
                height={150}
                className="h-24 md:h-32 w-auto"
                priority
              />
            </div>
          </div>

          {/* Tagline */}
          <p
            className="text-2xl md:text-4xl text-bbq-red font-bold mb-3 drop-shadow-lg"
            style={{ fontFamily: "var(--font-permanent-marker)" }}
          >
            WHERE DREAMS IGNITE!
          </p>
          <p className="text-white max-w-2xl mx-auto mb-8 text-sm md:text-base drop-shadow-md">
            Real-time BBQ competition leaderboard for the National High School
            BBQ Association. Track teams, scores, and rankings across events
            nationwide.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-bbq-red rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p
                className="text-3xl md:text-4xl font-bold text-smoke-black"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {stats.events > 0 ? stats.events : events.length}
              </p>
              <p className="text-xs md:text-sm text-medium-grey mt-1">Events</p>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-americana-blue rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p
                className="text-3xl md:text-4xl font-bold text-smoke-black"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {stats.teams > 0 ? stats.teams : "-"}
              </p>
              <p className="text-xs md:text-sm text-medium-grey mt-1">Teams</p>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-brisket-brown rounded-full">
                <School className="w-6 h-6 text-white" />
              </div>
              <p
                className="text-3xl md:text-4xl font-bold text-smoke-black"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {stats.schools > 0 ? stats.schools : "-"}
              </p>
              <p className="text-xs md:text-sm text-medium-grey mt-1">Schools</p>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gold rounded-full">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p
                className="text-3xl md:text-4xl font-bold text-smoke-black"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {stats.states > 0 ? stats.states : "-"}
              </p>
              <p className="text-xs md:text-sm text-medium-grey mt-1">States</p>
            </div>
          </div>

          {/* Secondary tagline */}
          <p
            className="mt-8 text-lg md:text-xl text-white/90 italic drop-shadow-md"
            style={{ fontFamily: "var(--font-permanent-marker)" }}
          >
            &ldquo;COME EAT OUR HOMEWORK!&rdquo;
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <SearchInput
            placeholder="Search events, cities, states..."
            onSearch={setSearchQuery}
          />

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <DivisionFilter
              selectedDivision={selectedDivision}
              onDivisionChange={setSelectedDivision}
            />

            <div className="flex gap-2">
              {(["all", "live", "upcoming", "completed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedStatus === status
                      ? status === "live"
                        ? "bg-bbq-red text-white"
                        : "bg-smoke-black text-white"
                      : "bg-white text-smoke-black border border-neutral-grey/30 hover:border-smoke-black"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
            <p className="text-smoke-black font-semibold">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 bg-white rounded-xl border border-bbq-red/30">
            <Flame className="w-12 h-12 mx-auto mb-4 text-bbq-red" />
            <p className="text-smoke-black font-semibold">Error loading events</p>
            <p className="text-medium-grey text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-bbq-red text-white rounded-lg hover:bg-bbq-red/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
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
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Other Events */}
            <section>
              <h2
                className="text-xl font-bold text-smoke-black mb-4"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {selectedStatus === "all"
                  ? "ALL EVENTS"
                  : selectedStatus === "live"
                    ? "LIVE EVENTS"
                    : selectedStatus.toUpperCase() + " EVENTS"}
              </h2>

              {otherEvents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-card-border">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
                  <p className="text-smoke-black font-semibold">No events found</p>
                  <p className="text-medium-grey text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-smoke-black text-white py-10 px-4 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-6">
            {/* Footer Logos */}
            <div className="flex items-center gap-6">
              <div className="bg-white p-3 rounded-xl">
                <Image
                  src="/images/nhsbbqa-logo.png"
                  alt="NHSBBQA"
                  width={120}
                  height={80}
                  className="h-14 w-auto"
                />
              </div>
              <div className="bg-white p-3 rounded-xl">
                <Image
                  src="/images/pitmstr-flame.png"
                  alt="PITMSTR"
                  width={60}
                  height={75}
                  className="h-14 w-auto"
                />
              </div>
            </div>
            <p
              className="text-sm text-white/80 text-center font-semibold tracking-wider"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              EDUCATION. BARBECUE. FAMILY.
            </p>
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} NHSBBQA&reg;. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
