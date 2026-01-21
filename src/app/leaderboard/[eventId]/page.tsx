"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import LeaderboardRow from "@/components/LeaderboardRow";
import CategoryFilter from "@/components/CategoryFilter";
import DivisionBadge from "@/components/DivisionBadge";
import SearchInput from "@/components/SearchInput";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Flame,
  Share2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { Event, LeaderboardEntry, Category } from "@/lib/types";

export default function EventLeaderboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>("Overall");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch event and leaderboard data
  const fetchData = async () => {
    try {
      setError(null);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`);
      const eventData = await eventResponse.json();

      if (eventData.success && eventData.data) {
        setEvent(eventData.data);
      } else {
        setError(eventData.error || "Failed to load event");
        return;
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch(
        `/api/leaderboard?eventId=${eventId}&category=${selectedCategory}`
      );
      const leaderboardData = await leaderboardResponse.json();

      if (leaderboardData.success && leaderboardData.data) {
        setLeaderboard(leaderboardData.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to connect to the server");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      setIsLoading(true);
      fetchData();
    }
  }, [eventId]);

  // Refetch leaderboard when category changes
  useEffect(() => {
    if (eventId && !isLoading) {
      // Fetch new leaderboard for selected category
      const fetchLeaderboard = async () => {
        try {
          const leaderboardResponse = await fetch(
            `/api/leaderboard?eventId=${eventId}&category=${selectedCategory}`
          );
          const leaderboardData = await leaderboardResponse.json();

          if (leaderboardData.success && leaderboardData.data) {
            setLeaderboard(leaderboardData.data);
          }
        } catch (err) {
          console.error("Error fetching leaderboard:", err);
        }
      };

      fetchLeaderboard();
    }
  }, [selectedCategory]);

  // Filter leaderboard by search
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery) return leaderboard;

    const query = searchQuery.toLowerCase();
    return leaderboard.filter(
      (entry) =>
        entry.teamName.toLowerCase().includes(query) ||
        entry.schoolName.toLowerCase().includes(query)
    );
  }, [leaderboard, searchQuery]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  // Handle share
  const handleShare = async () => {
    if (!event) return;

    if (navigator.share) {
      await navigator.share({
        title: `${event.name} - Live Leaderboard`,
        text: `Check out the live leaderboard for ${event.name}!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
          <p className="text-smoke-black font-semibold">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-medium-grey hover:text-smoke-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <div className="text-center py-12 bg-white rounded-xl border border-bbq-red/30">
            <Flame className="w-12 h-12 mx-auto mb-4 text-bbq-red" />
            <p className="text-smoke-black font-semibold">
              {error || "Event not found"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-bbq-red text-white rounded-lg hover:bg-bbq-red/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Event Header */}
      <section className="bg-white border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-medium-grey hover:text-smoke-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          {/* Event info card */}
          <div className="bg-light-grey rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* Status and Division */}
                <div className="flex items-center gap-2 mb-2">
                  {event.status === "live" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bbq-red text-white rounded text-xs font-semibold animate-pulse">
                      <Flame className="w-3 h-3" />
                      LIVE NOW
                    </span>
                  )}
                  <DivisionBadge division={event.division} />
                </div>

                {/* Event name */}
                <h1
                  className="text-xl font-bold text-smoke-black mb-2"
                  style={{ fontFamily: "var(--font-oswald)" }}
                >
                  {event.name}
                </h1>

                {/* Event details */}
                <div className="flex flex-col gap-1 text-sm text-medium-grey">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {event.location}
                      {event.city && event.state && ` - ${event.city}, ${event.state}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 bg-white rounded-lg border border-card-border hover:bg-light-grey transition-colors disabled:opacity-50"
                  aria-label="Refresh leaderboard"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-smoke-black ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white rounded-lg border border-card-border hover:bg-light-grey transition-colors"
                  aria-label="Share leaderboard"
                >
                  <Share2 className="w-5 h-5 text-smoke-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter
            categories={["Overall", ...event.categories] as Category[]}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput
            placeholder="Search teams, schools..."
            onSearch={setSearchQuery}
          />
        </div>

        {/* Leaderboard list */}
        <div className="bg-white rounded-xl border border-card-border overflow-hidden">
          {filteredLeaderboard.length > 0 ? (
            filteredLeaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.teamId}
                entry={entry}
                eventId={eventId}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-smoke-black font-semibold">
                {leaderboard.length === 0
                  ? "No teams registered yet"
                  : "No results found"}
              </p>
              <p className="text-medium-grey text-sm mt-1">
                {leaderboard.length === 0
                  ? "Teams will appear here once they are registered"
                  : "Try adjusting your search"}
              </p>
            </div>
          )}
        </div>

        {/* Results count */}
        {leaderboard.length > 0 && (
          <p className="text-center text-sm text-medium-grey mt-4">
            Showing {filteredLeaderboard.length} of {leaderboard.length} teams
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-smoke-black text-white py-6 px-4 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-neutral-grey">
            &copy; {new Date().getFullYear()} NHSBBQA&reg;. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
