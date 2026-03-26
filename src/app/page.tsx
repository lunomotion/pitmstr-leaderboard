"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import SearchInput from "@/components/SearchInput";
import DivisionFilter from "@/components/DivisionFilter";
import { Flame, Calendar, Trophy, Users, Loader2, MapPin, School, ArrowRight, ChevronRight, Star } from "lucide-react";
import type { Event, Division, EventStatus } from "@/lib/types";

// Sample events for display when no Airtable data
const SAMPLE_EVENTS: Event[] = [
  {
    id: "sample_1",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Texas State Championship",
    date: new Date().toISOString().split('T')[0],
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
    id: "sample_1b",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "San Antonio Smoke Classic",
    date: new Date().toISOString().split('T')[0],
    location: "San Antonio, TX",
    city: "San Antonio",
    state: "TX",
    division: "HSBBQ",
    status: "live",
    description: "Live competition in the heart of San Antonio with teams from across South Texas.",
    registeredTeams: 36,
    categories: ["Brisket", "Ribs", "Chicken", "Pork"],
  },
  {
    id: "sample_2",
    createdTime: "2025-01-01T00:00:00.000Z",
    name: "Oklahoma Smoke Showdown",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

// Carousel cards
const CAROUSEL_CARDS = [
  {
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=500&fit=crop",
    category: "STATE CHAMPIONSHIP",
    title: "Texas State BBQ Championship",
  },
  {
    image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=500&fit=crop",
    category: "TEAM SPOTLIGHT",
    title: "Team Ember - Grand Champions",
  },
  {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=500&fit=crop",
    category: "INVITATIONAL",
    title: "Louisiana Invitational Cook-Off",
  },
  {
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop",
    category: "REGISTRATION OPEN",
    title: "Register Your School Today",
  },
  {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=500&fit=crop",
    category: "NATIONAL EVENT",
    title: "THE SLAB: National Championship",
  },
  {
    image: "https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=400&h=500&fit=crop",
    category: "FREE GUIDE",
    title: "How to Start a School BBQ Program",
  },
  {
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&h=500&fit=crop",
    category: "COMMUNITY",
    title: "400+ Teams Across 14 States",
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

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const eventsResponse = await fetch("/api/events");
        const eventsData = await eventsResponse.json();
        if (eventsData.success && eventsData.data && eventsData.data.length > 0) {
          setEvents(eventsData.data);
        } else {
          setEvents(SAMPLE_EVENTS);
        }
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

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          event.city.toLowerCase().includes(query) ||
          event.state.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedDivision !== "all" && event.division !== selectedDivision) return false;
      if (selectedStatus !== "all" && event.status !== selectedStatus) return false;
      return true;
    });
  }, [events, searchQuery, selectedDivision, selectedStatus]);

  const liveEvents = filteredEvents.filter((e) => e.status === "live");
  const otherEvents = filteredEvents.filter((e) => e.status !== "live");

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 pb-8">
          {/* Headline */}
          <h1
            className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-smoke-black"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            America&apos;s CTE Food Sport
          </h1>

          {/* WHERE DREAMS IGNITE tagline */}
          <p
            className="text-center text-2xl md:text-3xl text-bbq-red mb-6"
            style={{ fontFamily: "var(--font-permanent-marker)" }}
          >
            WHERE DREAMS IGNITE!
          </p>

          {/* Subtitle */}
          <p className="text-center text-base sm:text-lg md:text-xl text-medium-grey max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one competition platform for high school and middle school BBQ programs.
            Real-time scoring, team management, and event operations - built for educators, loved by students.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 px-8 py-4 bg-bbq-red text-white rounded-full text-xl font-semibold hover:bg-bbq-red/90 transition-all hover:scale-105 shadow-lg shadow-bbq-red/20"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              Register Your School
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/knowledge-base"
              className="flex items-center gap-2 px-8 py-4 border border-neutral-grey/30 text-smoke-black rounded-full text-xl font-semibold hover:bg-light-grey transition-all"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              See How It Works
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-sm text-medium-grey font-medium">
                400+ teams across 14 states
              </span>
            </div>
          </div>

        </div>

        {/* ===== IMAGE CAROUSEL ===== */}
        <style>{`
          @keyframes carousel-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="relative w-full overflow-hidden py-8 bg-smoke-black">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #1a1a1a 0%, transparent 100%)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #1a1a1a 0%, transparent 100%)' }} />

          {/* "COME EAT OUR HOMEWORK" inside carousel band */}
          <p
            className="text-center text-sm text-white/40 italic mb-6 tracking-wide"
            style={{ fontFamily: "var(--font-permanent-marker)" }}
          >
            &ldquo;COME EAT OUR HOMEWORK!&rdquo;
          </p>

          {/* Scrolling track */}
          <div
            className="flex gap-5"
            style={{
              animation: 'carousel-scroll 55s linear infinite',
              width: 'max-content',
            }}
          >
            {[...CAROUSEL_CARDS, ...CAROUSEL_CARDS].map((card, index) => (
              <a
                key={index}
                href="https://www.highschoolbbqleague.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 relative overflow-hidden rounded-2xl group cursor-pointer"
                style={{ width: '300px', height: '400px' }}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">{card.category}</span>
                  <h3 className="text-lg font-bold text-white mt-1 leading-tight" style={{ fontFamily: "var(--font-oswald)" }}>{card.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 md:gap-20">
            <div className="text-center">
              <p className="text-4xl font-bold text-smoke-black" style={{ fontFamily: "var(--font-oswald)" }}>14</p>
              <p className="text-xs text-medium-grey uppercase tracking-wider mt-1">States</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-smoke-black" style={{ fontFamily: "var(--font-oswald)" }}>400+</p>
              <p className="text-xs text-medium-grey uppercase tracking-wider mt-1">Teams</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-smoke-black" style={{ fontFamily: "var(--font-oswald)" }}>200+</p>
              <p className="text-xs text-medium-grey uppercase tracking-wider mt-1">Schools</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-smoke-black" style={{ fontFamily: "var(--font-oswald)" }}>50+</p>
              <p className="text-xs text-medium-grey uppercase tracking-wider mt-1">Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EVENTS SECTION ===== */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          <SearchInput placeholder="Search events, cities, states..." onSearch={setSearchQuery} />
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <DivisionFilter selectedDivision={selectedDivision} onDivisionChange={setSelectedDivision} />
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
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
            <p className="text-smoke-black font-semibold">Loading events...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-12 bg-white rounded-xl border border-bbq-red/30">
            <Flame className="w-12 h-12 mx-auto mb-4 text-bbq-red" />
            <p className="text-smoke-black font-semibold">Error loading events</p>
            <p className="text-medium-grey text-sm mt-1">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-bbq-red text-white rounded-lg hover:bg-bbq-red/90 transition-colors">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {liveEvents.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-bbq-red animate-pulse" />
                  <h2 className="text-xl font-bold text-smoke-black" style={{ fontFamily: "var(--font-oswald)" }}>LIVE NOW</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveEvents.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold text-smoke-black mb-4" style={{ fontFamily: "var(--font-oswald)" }}>
                {selectedStatus === "all" ? "ALL EVENTS" : selectedStatus === "live" ? "LIVE EVENTS" : selectedStatus.toUpperCase() + " EVENTS"}
              </h2>
              {otherEvents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherEvents.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-card-border">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
                  <p className="text-smoke-black font-semibold">No events found</p>
                  <p className="text-medium-grey text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>

      {/* ===== FOOTER WITH ANIMATED FLAMES ===== */}
      <footer className="bg-smoke-black text-white px-4 mt-12 relative overflow-hidden">
        <style>{`
          @keyframes flicker {
            0%, 100% { transform: scaleY(1) scaleX(1) translateY(0); opacity: 1; }
            25% { transform: scaleY(1.2) scaleX(0.9) translateY(-4px); opacity: 0.9; }
            50% { transform: scaleY(0.85) scaleX(1.1) translateY(2px); opacity: 1; }
            75% { transform: scaleY(1.1) scaleX(0.95) translateY(-2px); opacity: 0.85; }
          }
          @keyframes flicker2 {
            0%, 100% { transform: scaleY(1) scaleX(1) translateY(0); opacity: 0.9; }
            20% { transform: scaleY(0.9) scaleX(1.05) translateY(3px); opacity: 1; }
            40% { transform: scaleY(1.15) scaleX(0.92) translateY(-5px); opacity: 0.8; }
            60% { transform: scaleY(0.95) scaleX(1.08) translateY(-1px); opacity: 0.95; }
            80% { transform: scaleY(1.08) scaleX(0.97) translateY(-3px); opacity: 0.85; }
          }
          @keyframes flicker3 {
            0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.85; }
            30% { transform: scaleY(1.25) translateY(-6px); opacity: 1; }
            60% { transform: scaleY(0.8) translateY(1px); opacity: 0.75; }
            90% { transform: scaleY(1.1) translateY(-3px); opacity: 0.9; }
          }
          @keyframes glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .flame-tongue {
            position: absolute;
            bottom: 0;
            border-radius: 50% 50% 20% 20%;
            filter: blur(2px);
            transform-origin: bottom center;
          }
          .flame-tongue-inner {
            position: absolute;
            bottom: 0;
            border-radius: 50% 50% 20% 20%;
            filter: blur(1px);
            transform-origin: bottom center;
          }
        `}</style>

        <div className="relative w-full" style={{ height: '80px' }}>
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '60px', background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 111, 0, 0.15) 0%, transparent 70%)', animation: 'glow 3s ease-in-out infinite' }} />
          <div className="flame-tongue" style={{ left: '5%', width: '30px', height: '50px', background: 'linear-gradient(to top, #C62828, #FF6F00 40%, #FFD600 90%)', animation: 'flicker 1.5s ease-in-out infinite', opacity: 0.7 }} />
          <div className="flame-tongue-inner" style={{ left: '6%', width: '16px', height: '35px', background: 'linear-gradient(to top, #FF8F00, #FFD600 60%, #FFF9C4 95%)', animation: 'flicker2 1.8s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue" style={{ left: '10%', width: '22px', height: '40px', background: 'linear-gradient(to top, #C62828, #FF6F00 50%, #FFD600 95%)', animation: 'flicker2 2s ease-in-out infinite', opacity: 0.6 }} />
          <div className="flame-tongue" style={{ left: '15%', width: '35px', height: '55px', background: 'linear-gradient(to top, #C62828, #FF8F00 35%, #FF6F00 70%, #FFD600 95%)', animation: 'flicker3 1.3s ease-in-out infinite', opacity: 0.8 }} />
          <div className="flame-tongue-inner" style={{ left: '16%', width: '20px', height: '40px', background: 'linear-gradient(to top, #FF8F00, #FFD600 50%, #FFF9C4 90%)', animation: 'flicker 1.6s ease-in-out infinite', opacity: 0.85 }} />
          <div className="flame-tongue" style={{ left: '21%', width: '18px', height: '32px', background: 'linear-gradient(to top, #C62828, #FF6F00 60%, #FFD600 95%)', animation: 'flicker 2.2s ease-in-out infinite', opacity: 0.55 }} />
          <div className="flame-tongue" style={{ left: '28%', width: '28px', height: '48px', background: 'linear-gradient(to top, #C62828, #FF6F00 45%, #FFD600 90%)', animation: 'flicker2 1.4s ease-in-out infinite', opacity: 0.75 }} />
          <div className="flame-tongue-inner" style={{ left: '29%', width: '14px', height: '32px', background: 'linear-gradient(to top, #FF8F00, #FFD600 55%, #FFF9C4 95%)', animation: 'flicker3 1.7s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue" style={{ left: '34%', width: '24px', height: '42px', background: 'linear-gradient(to top, #C62828, #FF8F00 40%, #FFD600 85%)', animation: 'flicker 1.9s ease-in-out infinite', opacity: 0.65 }} />
          <div className="flame-tongue" style={{ left: '39%', width: '32px', height: '58px', background: 'linear-gradient(to top, #C62828, #FF6F00 30%, #FF8F00 60%, #FFD600 90%)', animation: 'flicker3 1.2s ease-in-out infinite', opacity: 0.85 }} />
          <div className="flame-tongue-inner" style={{ left: '40%', width: '18px', height: '42px', background: 'linear-gradient(to top, #FF8F00, #FFD600 50%, #FFF9C4 90%)', animation: 'flicker2 1.5s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue" style={{ left: '44%', width: '26px', height: '52px', background: 'linear-gradient(to top, #C62828, #FF6F00 40%, #FFD600 90%)', animation: 'flicker 1.6s ease-in-out infinite', opacity: 0.7 }} />
          <div className="flame-tongue" style={{ left: '48%', width: '38px', height: '70px', background: 'linear-gradient(to top, #C62828, #FF6F00 30%, #FF8F00 55%, #FFD600 85%)', animation: 'flicker2 1.1s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue-inner" style={{ left: '49.5%', width: '22px', height: '52px', background: 'linear-gradient(to top, #FF8F00, #FFD600 45%, #FFF9C4 85%)', animation: 'flicker3 1.4s ease-in-out infinite', opacity: 0.95 }} />
          <div className="flame-tongue" style={{ left: '53%', width: '30px', height: '60px', background: 'linear-gradient(to top, #C62828, #FF8F00 35%, #FF6F00 60%, #FFD600 90%)', animation: 'flicker 1.3s ease-in-out infinite', opacity: 0.8 }} />
          <div className="flame-tongue-inner" style={{ left: '54%', width: '16px', height: '44px', background: 'linear-gradient(to top, #FF8F00, #FFD600 50%, #FFF9C4 90%)', animation: 'flicker2 1.7s ease-in-out infinite', opacity: 0.85 }} />
          <div className="flame-tongue" style={{ left: '59%', width: '28px', height: '50px', background: 'linear-gradient(to top, #C62828, #FF6F00 42%, #FFD600 88%)', animation: 'flicker3 1.5s ease-in-out infinite', opacity: 0.75 }} />
          <div className="flame-tongue-inner" style={{ left: '60%', width: '15px', height: '35px', background: 'linear-gradient(to top, #FF8F00, #FFD600 55%, #FFF9C4 90%)', animation: 'flicker 1.9s ease-in-out infinite', opacity: 0.85 }} />
          <div className="flame-tongue" style={{ left: '65%', width: '22px', height: '38px', background: 'linear-gradient(to top, #C62828, #FF6F00 50%, #FFD600 92%)', animation: 'flicker2 2.1s ease-in-out infinite', opacity: 0.6 }} />
          <div className="flame-tongue" style={{ left: '70%', width: '34px', height: '55px', background: 'linear-gradient(to top, #C62828, #FF8F00 32%, #FF6F00 65%, #FFD600 92%)', animation: 'flicker 1.2s ease-in-out infinite', opacity: 0.8 }} />
          <div className="flame-tongue-inner" style={{ left: '71%', width: '20px', height: '40px', background: 'linear-gradient(to top, #FF8F00, #FFD600 48%, #FFF9C4 88%)', animation: 'flicker3 1.6s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue" style={{ left: '77%', width: '26px', height: '45px', background: 'linear-gradient(to top, #C62828, #FF6F00 45%, #FFD600 90%)', animation: 'flicker2 1.4s ease-in-out infinite', opacity: 0.7 }} />
          <div className="flame-tongue-inner" style={{ left: '78%', width: '14px', height: '30px', background: 'linear-gradient(to top, #FF8F00, #FFD600 55%, #FFF9C4 90%)', animation: 'flicker 1.8s ease-in-out infinite', opacity: 0.85 }} />
          <div className="flame-tongue" style={{ left: '83%', width: '20px', height: '36px', background: 'linear-gradient(to top, #C62828, #FF6F00 55%, #FFD600 95%)', animation: 'flicker3 2s ease-in-out infinite', opacity: 0.55 }} />
          <div className="flame-tongue" style={{ left: '88%', width: '30px', height: '48px', background: 'linear-gradient(to top, #C62828, #FF8F00 38%, #FF6F00 68%, #FFD600 92%)', animation: 'flicker 1.3s ease-in-out infinite', opacity: 0.75 }} />
          <div className="flame-tongue-inner" style={{ left: '89%', width: '17px', height: '34px', background: 'linear-gradient(to top, #FF8F00, #FFD600 52%, #FFF9C4 90%)', animation: 'flicker2 1.6s ease-in-out infinite', opacity: 0.9 }} />
          <div className="flame-tongue" style={{ left: '94%', width: '24px', height: '42px', background: 'linear-gradient(to top, #C62828, #FF6F00 48%, #FFD600 92%)', animation: 'flicker3 1.7s ease-in-out infinite', opacity: 0.65 }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '4px', background: 'linear-gradient(90deg, transparent 0%, #C62828 10%, #FF6F00 30%, #FFD600 50%, #FF6F00 70%, #C62828 90%, transparent 100%)', animation: 'glow 2s ease-in-out infinite', filter: 'blur(2px)' }} />
        </div>

        <div className="relative z-10 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center -mt-14 relative">
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255, 111, 0, 0.25) 0%, transparent 70%)', animation: 'glow 2.5s ease-in-out infinite', filter: 'blur(4px)' }} />
                <Image src="/pitmstr-logo-text-white.png" alt="PITMSTR" width={200} height={40} className="h-10 w-auto relative z-10 drop-shadow-[0_0_12px_rgba(255,111,0,0.4)]" />
              </div>
              <p className="text-sm text-white/80 text-center font-semibold tracking-wider" style={{ fontFamily: "var(--font-oswald)" }}>
                EDUCATION. BARBECUE. FAMILY.
              </p>
              <p className="text-xs text-white/50">
                &copy; {new Date().getFullYear()} NHSBBQA&reg;. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
