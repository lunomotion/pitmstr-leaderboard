"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import RankBadge from "@/components/RankBadge";
import DivisionBadge from "@/components/DivisionBadge";
import {
  ArrowLeft,
  Trophy,
  Users,
  MapPin,
  School,
  Award,
  ChevronRight,
} from "lucide-react";
import type { Team, LeaderboardEntry, Category, TeamMember } from "@/lib/types";

// Mock team data - will be replaced with Airtable data
const MOCK_TEAM: Team = {
  id: "team_001",
  createdTime: "2024-01-01T00:00:00.000Z",
  name: "Smoke Masters",
  schoolId: "sch_001",
  schoolName: "Lincoln High School",
  division: "HSBBQ",
  coach: "Mr. Williams",
  state: "TX",
};

// Mock scores for this event
const MOCK_SCORES: { category: Category; score: number; rank: number }[] = [
  { category: "Overall", score: 98.5, rank: 1 },
  { category: "Brisket", score: 99.0, rank: 1 },
  { category: "Ribs", score: 97.5, rank: 2 },
  { category: "Chicken", score: 98.0, rank: 1 },
];

// Mock awards/achievements
const MOCK_AWARDS = [
  {
    id: "a1",
    title: "Regional Champion",
    eventName: "Texas Regional 2025",
    category: "Overall",
    placement: 1,
  },
  {
    id: "a2",
    title: "Best Brisket",
    eventName: "Oklahoma Invitational 2025",
    category: "Brisket",
    placement: 1,
  },
  {
    id: "a3",
    title: "Runner Up",
    eventName: "Kansas City Classic 2025",
    category: "Overall",
    placement: 2,
  },
];

export default function TeamDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  // In production, fetch from API
  const team = MOCK_TEAM;
  const scores = MOCK_SCORES;
  const awards = MOCK_AWARDS;

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Back navigation */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link
            href={`/leaderboard/${eventId}`}
            className="inline-flex items-center gap-1 text-sm text-medium-grey hover:text-smoke-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Team Header Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Team icon/logo placeholder */}
            <div className="flex-shrink-0 w-16 h-16 bg-smoke-black rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gold" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Division badge */}
              <div className="mb-2">
                <DivisionBadge division={team.division} />
              </div>

              {/* Team name */}
              <h1
                className="text-2xl font-bold text-smoke-black mb-1"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {team.name}
              </h1>

              {/* School info */}
              <Link
                href={`/schools/${team.schoolId}`}
                className="inline-flex items-center gap-2 text-americana-blue hover:underline"
              >
                <School className="w-4 h-4" />
                <span className="font-semibold">{team.schoolName}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              {/* Location */}
              <div className="flex items-center gap-2 mt-2 text-sm text-medium-grey">
                <MapPin className="w-4 h-4" />
                <span>{team.state}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Scores */}
        <section className="mb-6">
          <h2
            className="text-lg font-bold text-smoke-black mb-3"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            EVENT SCORES
          </h2>
          <div className="card overflow-hidden">
            {scores.map((score, index) => (
              <div
                key={score.category}
                className={`flex items-center justify-between p-4 ${
                  index !== scores.length - 1 ? "border-b border-card-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={score.rank} size="sm" />
                  <span className="font-semibold text-smoke-black">
                    {score.category}
                  </span>
                </div>
                <span className="score-display">{score.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Team Members */}
        <section className="mb-6">
          <h2
            className="text-lg font-bold text-smoke-black mb-3 flex items-center gap-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <Users className="w-5 h-5" />
            TEAM ROSTER
          </h2>
          <div className="card p-4">
            <p className="text-sm text-medium-grey">
              {team.coach && (
                <span className="block mb-2">
                  <span className="font-semibold text-smoke-black">Coach:</span> {team.coach}
                </span>
              )}
              <span className="text-medium-grey">
                Team member details coming soon from the PITMSTR database.
              </span>
            </p>
          </div>
        </section>

        {/* Awards & Achievements */}
        <section className="mb-6">
          <h2
            className="text-lg font-bold text-smoke-black mb-3 flex items-center gap-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            <Award className="w-5 h-5" />
            AWARDS & ACHIEVEMENTS
          </h2>
          <div className="grid gap-3">
            {awards.map((award) => (
              <div
                key={award.id}
                className="card p-4 flex items-center gap-4"
              >
                <RankBadge rank={award.placement} size="lg" />
                <div>
                  <p className="font-semibold text-smoke-black">{award.title}</p>
                  <p className="text-sm text-medium-grey">
                    {award.eventName}
                    {award.category && ` - ${award.category}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-primary flex-1">Follow Team</button>
          <button className="btn-secondary flex-1">View Full Profile</button>
        </div>
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
