"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import DivisionBadge from "@/components/DivisionBadge";
import {
  ArrowLeft,
  Loader2,
  School as SchoolIcon,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import type { School, Team } from "@/lib/types";

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [school, setSchool] = useState<School | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch school data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/schools/${schoolId}`);
        const data = await response.json();

        if (data.success && data.data) {
          setSchool(data.data.school);
          setTeams(data.data.teams || []);
        } else {
          setError(data.error || "Failed to load school");
        }
      } catch (err) {
        console.error("Error fetching school:", err);
        setError("Failed to connect to the server");
      } finally {
        setIsLoading(false);
      }
    }

    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-bbq-red animate-spin" />
          <p className="text-smoke-black font-semibold">Loading school...</p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-light-grey">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-medium-grey hover:text-smoke-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="text-center py-12 bg-white rounded-xl border border-bbq-red/30">
            <SchoolIcon className="w-12 h-12 mx-auto mb-4 text-bbq-red" />
            <p className="text-smoke-black font-semibold">
              {error || "School not found"}
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

      {/* School Header */}
      <section className="bg-gradient-to-br from-americana-blue to-smoke-black text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>

          {/* School info */}
          <div className="flex items-center gap-4 mb-4">
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-20 h-20 rounded-xl object-contain bg-white p-2"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center">
                <SchoolIcon className="w-10 h-10 text-white/70" />
              </div>
            )}
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {school.name}
              </h1>
              <div className="flex items-center gap-2 text-white/80 mt-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {school.city}, {school.state}
                </span>
              </div>
              {school.district && (
                <p className="text-white/60 text-sm mt-1">{school.district}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Teams */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            TEAMS ({teams.length})
          </h2>

          {teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="block bg-white rounded-xl border border-card-border p-4 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DivisionBadge division={team.division} size="sm" />
                      </div>
                      <h3
                        className="font-bold text-smoke-black group-hover:text-bbq-red transition-colors"
                        style={{ fontFamily: "var(--font-oswald)" }}
                      >
                        {team.name}
                      </h3>
                      {team.coach && (
                        <p className="text-sm text-medium-grey mt-1">
                          Coach: {team.coach}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-grey group-hover:text-bbq-red transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-card-border p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
              <p className="text-smoke-black font-semibold">No teams registered</p>
              <p className="text-medium-grey text-sm mt-1">
                Teams from this school will appear here once registered
              </p>
            </div>
          )}
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
