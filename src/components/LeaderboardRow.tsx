"use client";

import Link from "next/link";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/types";
import RankBadge from "./RankBadge";
import DivisionBadge from "./DivisionBadge";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  showDivision?: boolean;
  eventId?: string;
}

export default function LeaderboardRow({
  entry,
  showDivision = false,
  eventId,
}: LeaderboardRowProps) {
  const ChangeIndicator = () => {
    if (!entry.change || entry.change === "same") {
      return <Minus className="w-3 h-3 text-neutral-grey" />;
    }
    if (entry.change === "up") {
      return <TrendingUp className="w-3 h-3 text-success-green" />;
    }
    if (entry.change === "down") {
      return <TrendingDown className="w-3 h-3 text-bbq-red" />;
    }
    if (entry.change === "new") {
      return (
        <span className="text-[10px] font-bold text-americana-blue">NEW</span>
      );
    }
    return null;
  };

  const content = (
    <div className="flex items-center gap-3 p-3 bg-white border-b border-card-border hover:bg-light-grey/50 transition-colors cursor-pointer">
      {/* Rank */}
      <div className="flex-shrink-0">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Team/School info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className="font-bold text-smoke-black truncate"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {entry.schoolName}
          </h4>
          {showDivision && <DivisionBadge division={entry.division} size="sm" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-medium-grey">
          <span className="truncate">{entry.teamName}</span>
          {entry.state && (
            <>
              <span className="text-neutral-grey">•</span>
              <span>{entry.state}</span>
            </>
          )}
        </div>
      </div>

      {/* Score and change */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="score-display">{entry.score.toFixed(2)}</span>
          <div className="flex items-center gap-1">
            <ChangeIndicator />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-grey" />
      </div>
    </div>
  );

  if (eventId) {
    return (
      <Link href={`/leaderboard/${eventId}/team/${entry.teamId}`}>
        {content}
      </Link>
    );
  }

  return <Link href={`/teams/${entry.teamId}`}>{content}</Link>;
}
