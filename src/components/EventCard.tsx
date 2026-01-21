"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, ChevronRight, Flame } from "lucide-react";
import type { Event } from "@/lib/types";
import DivisionBadge from "./DivisionBadge";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const statusColors = {
    live: "bg-bbq-red text-white animate-pulse",
    upcoming: "bg-americana-blue text-white",
    completed: "bg-neutral-grey text-smoke-black",
    cancelled: "bg-neutral-grey/50 text-smoke-black/50",
  };

  const statusLabels = {
    live: "LIVE NOW",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Link href={`/leaderboard/${event.id}`}>
      <div className="card card-hover p-4 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Status and Division badges */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${statusColors[event.status]}`}
              >
                {event.status === "live" && <Flame className="w-3 h-3" />}
                {statusLabels[event.status]}
              </span>
              <DivisionBadge division={event.division} />
            </div>

            {/* Event name */}
            <h3
              className="text-lg font-bold text-smoke-black mb-1 truncate"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              {event.name}
            </h3>

            {/* Event details */}
            <div className="flex flex-col gap-1 text-sm text-medium-grey">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {event.city}, {event.state}
                </span>
              </div>
              {event.registeredTeams && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {event.registeredTeams}
                    {event.maxTeams ? ` / ${event.maxTeams}` : ""} Teams
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-light-grey">
            <ChevronRight className="w-5 h-5 text-smoke-black" />
          </div>
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="mt-3 pt-3 border-t border-card-border">
            <div className="flex flex-wrap gap-1">
              {event.categories.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="px-2 py-0.5 bg-light-grey text-smoke-black text-xs rounded"
                >
                  {category}
                </span>
              ))}
              {event.categories.length > 4 && (
                <span className="px-2 py-0.5 text-medium-grey text-xs">
                  +{event.categories.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
