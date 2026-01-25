"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import SearchInput from "@/components/SearchInput";
import DivisionFilter from "@/components/DivisionFilter";
import { Calendar, Loader2, Filter, Plus, X, Trash2 } from "lucide-react";
import type { Event, Division, EventStatus } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<Division | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | "all">("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    city: "",
    state: "",
    division: "HSBBQ",
    description: "",
  });

  // Get unique states from events
  const availableStates = useMemo(() => {
    const states = new Set(events.map(e => e.state).filter(Boolean));
    return Array.from(states).sort();
  }, [events]);

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

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        setNewEvent({ name: "", date: "", city: "", state: "", division: "HSBBQ", description: "" });
        fetchEvents();
      } else {
        alert("Failed to create event: " + json.error);
      }
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        setDeleteConfirm(null);
        fetchEvents();
      } else {
        alert("Failed to delete event: " + json.error);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.state.toLowerCase().includes(query) ||
          (event.location && event.location.toLowerCase().includes(query));
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

      // State filter
      if (selectedState !== "all" && event.state !== selectedState) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedDivision, selectedStatus, selectedState]);

  // Group events by status
  const liveEvents = filteredEvents.filter((e) => e.status === "live");
  const upcomingEvents = filteredEvents.filter((e) => e.status === "upcoming");
  const completedEvents = filteredEvents.filter((e) => e.status === "completed");

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-smoke-black to-americana-blue text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              EVENTS
            </h1>
            <p className="text-white/70">
              Browse all BBQ competitions across the nation
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bbq-red text-white rounded-xl font-medium text-sm hover:bg-bbq-red/90 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b border-card-border sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="space-y-4">
            <SearchInput
              placeholder="Search events by name, city, or state..."
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

              {/* Status Filter */}
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
                        : "bg-light-grey text-smoke-black border border-card-border hover:border-smoke-black"
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
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
            <p className="text-smoke-black font-semibold">Loading events...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Live Events */}
            {liveEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 bg-bbq-red rounded-full animate-pulse" />
                  <h2
                    className="text-xl font-bold text-smoke-black"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    LIVE NOW ({liveEvents.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={setDeleteConfirm} />
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
                  UPCOMING EVENTS ({upcomingEvents.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={setDeleteConfirm} />
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
                  COMPLETED EVENTS ({completedEvents.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedEvents.map((event) => (
                    <EventCard key={event.id} event={event} onDelete={setDeleteConfirm} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-card-border">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
                <p className="text-smoke-black font-semibold">No events found</p>
                <p className="text-medium-grey text-sm mt-1">
                  Try adjusting your filters
                </p>
              </div>
            )}

            {/* Results count */}
            {filteredEvents.length > 0 && (
              <p className="text-center text-sm text-medium-grey mt-8">
                Showing {filteredEvents.length} of {events.length} events
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

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-smoke-black">Add New Event</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-light-grey rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                  placeholder="e.g., Texas State Championship"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-smoke-black mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                    className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                    placeholder="Fort Worth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-smoke-black mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newEvent.state}
                    onChange={(e) => setNewEvent({ ...newEvent, state: e.target.value })}
                    className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                    placeholder="TX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Division
                </label>
                <select
                  value={newEvent.division}
                  onChange={(e) => setNewEvent({ ...newEvent, division: e.target.value })}
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                >
                  <option value="HSBBQ">High School (HSBBQ)</option>
                  <option value="MSBBQ">Middle School (MSBBQ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-smoke-black mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-bbq-red/20"
                  rows={3}
                  placeholder="Event description..."
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
                  {isSubmitting ? "Adding..." : "Add Event"}
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
            <h2 className="text-xl font-bold text-smoke-black mb-2">Delete Event?</h2>
            <p className="text-medium-grey mb-6">
              This action cannot be undone. This will permanently delete the event.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-card-border rounded-xl font-medium text-smoke-black hover:bg-light-grey"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirm)}
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
