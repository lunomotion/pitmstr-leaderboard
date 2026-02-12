"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Trophy,
  Calendar,
  Star,
  LogOut,
  ArrowLeft,
  Loader2,
  Check,
  LinkIcon,
  Users,
  School,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TeamOption {
  id: string;
  name: string;
  schoolName?: string;
  division: string;
  state?: string;
}

interface TeamData {
  id: string;
  name: string;
  division: string;
  coach?: string;
  state?: string;
  schoolName?: string;
  schoolId?: string;
}

interface MemberData {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export default function StudentParentDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const metadata = (user?.publicMetadata as Record<string, unknown>) || {};
  const role = metadata.role as string | undefined;
  const teamId = metadata.teamId as string | undefined;
  const isParent = role === "parent";

  // Team picker state
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Dashboard data state
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [schoolName, setSchoolName] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);

  // Redirect non-students/parents
  useEffect(() => {
    if (isLoaded && role !== "student" && role !== "parent") {
      router.push("/dashboard");
    }
  }, [isLoaded, role, router]);

  // If no team linked, fetch teams list for picker
  useEffect(() => {
    if (isLoaded && !teamId) {
      fetch("/api/teams")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTeams(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch teams:", err));
    }
  }, [isLoaded, teamId]);

  // If team is linked, fetch team data
  useEffect(() => {
    if (isLoaded && teamId) {
      setLoadingData(true);
      fetch(`/api/teams/${teamId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setTeamData(data.data.team);
            setMembers(data.data.members || []);
            setSchoolName(data.data.school?.name || "");
          }
        })
        .catch((err) => console.error("Failed to fetch team data:", err))
        .finally(() => setLoadingData(false));
    }
  }, [isLoaded, teamId]);

  const handleLinkTeam = async () => {
    if (!selectedTeamId || !user) return;

    setLinking(true);
    setLinkError("");

    try {
      const res = await fetch(`/api/users/${user.id}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedTeamId }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.reload();
      } else {
        setLinkError(data.error || "Failed to link team");
      }
    } catch {
      setLinkError("Network error. Please try again.");
    } finally {
      setLinking(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--light-grey)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (role !== "student" && role !== "parent") return null;

  return (
    <div className="min-h-screen bg-[var(--light-grey)]">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-lg text-slate-900">
                {isParent ? "Parent" : "Student"} Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <SignOutButton redirectUrl="/">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.firstName || (isParent ? "Parent" : "Pitmaster")}!
          </h2>
          <p className="text-slate-500 mt-1">
            {isParent
              ? "Track your student\u2019s team and competition results."
              : "Track your team and competition results."}
          </p>
        </div>

        {!teamId ? (
          /* ── No team linked: show picker ── */
          <div className="bg-white rounded-xl border border-slate-100 p-8 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-[var(--bbq-red)]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Link Your Team
                </h3>
                <p className="text-sm text-slate-500">
                  Select your team to get started. This is a one-time setup.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select your team
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--bbq-red)] focus:border-transparent"
                >
                  <option value="">Choose a team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.schoolName ? ` — ${t.schoolName}` : ""}
                      {t.state ? ` (${t.state})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {linkError && (
                <p className="text-sm text-red-600">{linkError}</p>
              )}

              <button
                onClick={handleLinkTeam}
                disabled={!selectedTeamId || linking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bbq-red)] text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {linking ? "Linking..." : "Link Team"}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Can&apos;t find your team? Contact your teacher or admin.
              </p>
            </div>
          </div>
        ) : loadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          /* ── Team linked: show real data ── */
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[var(--bbq-red)]" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">My Team</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {teamData?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">School</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {schoolName || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Teammates</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {members.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {members.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Your Teammates</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {member.name}
                          </p>
                          {member.role && (
                            <p className="text-xs text-slate-500">
                              {member.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
                <p>
                  Check the{" "}
                  <Link
                    href="/leaderboard"
                    className="text-[var(--americana-blue)] hover:underline"
                  >
                    leaderboard
                  </Link>{" "}
                  for live scores!
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
