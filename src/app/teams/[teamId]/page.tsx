"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import DivisionBadge from "@/components/DivisionBadge";
import {
  ArrowLeft,
  Loader2,
  Users,
  School,
  MapPin,
  Trophy,
  User,
  Mail,
  ChevronRight,
} from "lucide-react";
import type { Team, TeamMember, School as SchoolType } from "@/lib/types";

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [school, setSchool] = useState<SchoolType | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch team details
        const teamResponse = await fetch(`/api/teams/${teamId}`);
        const teamData = await teamResponse.json();

        if (teamData.success && teamData.data) {
          setTeam(teamData.data.team);
          setMembers(teamData.data.members || []);
          setSchool(teamData.data.school || null);
        } else {
          setError(teamData.error || "Failed to load team");
        }
      } catch (err) {
        console.error("Error fetching team:", err);
        setError("Failed to connect to the server");
      } finally {
        setIsLoading(false);
      }
    }

    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
          <p className="text-smoke-black font-semibold">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-medium-grey hover:text-smoke-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <div className="text-center py-12 bg-white rounded-xl border border-bbq-red/30">
            <Users className="w-12 h-12 mx-auto mb-4 text-bbq-red" />
            <p className="text-smoke-black font-semibold">
              {error || "Team not found"}
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

      {/* Team Header */}
      <section className="bg-gradient-to-br from-smoke-black to-brisket-brown text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>

          {/* Team info */}
          <div className="flex items-center gap-2 mb-3">
            <DivisionBadge division={team.division} />
            {team.state && (
              <span className="flex items-center gap-1 text-sm text-white/70">
                <MapPin className="w-4 h-4" />
                {team.state}
              </span>
            )}
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            {team.name}
          </h1>

          {team.schoolName && (
            <p className="text-white/80 flex items-center gap-2">
              <School className="w-5 h-5" />
              {team.schoolName}
            </p>
          )}

          {team.coach && (
            <p className="text-white/60 text-sm mt-2">Coach: {team.coach}</p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* School Card */}
        {school && (
          <section className="mb-8">
            <h2
              className="text-lg font-bold text-smoke-black mb-4"
              style={{ fontFamily: "var(--font-oswald)" }}
            >
              SCHOOL
            </h2>
            <Link
              href={`/schools/${school.id}`}
              className="block bg-white rounded-xl border border-card-border p-4 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="font-bold text-smoke-black group-hover:text-bbq-red transition-colors"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    {school.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-medium-grey mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {school.city}, {school.state}
                    </span>
                  </div>
                  {school.district && (
                    <p className="text-xs text-medium-grey mt-1">
                      {school.district}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-grey group-hover:text-bbq-red transition-colors" />
              </div>
            </Link>
          </section>
        )}

        {/* Team Members */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            TEAM MEMBERS ({members.length})
          </h2>

          {members.length > 0 ? (
            <div className="bg-white rounded-xl border border-card-border overflow-hidden">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className={`p-4 flex items-center gap-4 ${
                    index < members.length - 1 ? "border-b border-card-border" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-light-grey rounded-full flex items-center justify-center flex-shrink-0">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-medium-grey" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-smoke-black truncate">
                      {member.name}
                    </p>
                    {member.role && (
                      <p className="text-sm text-bbq-red font-medium">
                        {member.role}
                      </p>
                    )}
                  </div>

                  {/* Contact */}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 text-medium-grey hover:text-bbq-red transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-card-border p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
              <p className="text-smoke-black font-semibold">No members listed</p>
              <p className="text-medium-grey text-sm mt-1">
                Team member information will appear here once added
              </p>
            </div>
          )}
        </section>

        {/* Competition History */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            COMPETITION HISTORY
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gold" />
            <p className="text-smoke-black font-semibold">Coming Soon</p>
            <p className="text-medium-grey text-sm mt-1">
              Competition results and rankings will be displayed here
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-smoke-black text-white py-8 px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center">
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
