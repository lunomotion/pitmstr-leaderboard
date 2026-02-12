"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  School,
  Users,
  Calendar,
  LogOut,
  ArrowLeft,
  Loader2,
  Check,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SchoolOption {
  id: string;
  name: string;
  city: string;
  state: string;
  teams?: string[];
}

interface TeamData {
  id: string;
  name: string;
  division: string;
  coach?: string;
  state?: string;
}

export default function TeacherDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const role = (user?.publicMetadata as Record<string, unknown>)?.role as
    | string
    | undefined;
  const schoolId = (user?.publicMetadata as Record<string, unknown>)
    ?.schoolId as string | undefined;

  // School picker state
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Dashboard data state
  const [schoolData, setSchoolData] = useState<SchoolOption | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Redirect non-teachers
  useEffect(() => {
    if (isLoaded && role !== "teacher") {
      router.push("/dashboard");
    }
  }, [isLoaded, role, router]);

  // If no school linked, fetch schools list for picker
  useEffect(() => {
    if (isLoaded && !schoolId) {
      fetch("/api/schools")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSchools(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch schools:", err));
    }
  }, [isLoaded, schoolId]);

  // If school is linked, fetch school data + teams
  useEffect(() => {
    if (isLoaded && schoolId) {
      setLoadingData(true);
      fetch(`/api/schools/${schoolId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSchoolData(data.data.school);
            setTeams(data.data.teams || []);
          }
        })
        .catch((err) => console.error("Failed to fetch school data:", err))
        .finally(() => setLoadingData(false));
    }
  }, [isLoaded, schoolId]);

  const handleLinkSchool = async () => {
    if (!selectedSchoolId || !user) return;

    setLinking(true);
    setLinkError("");

    try {
      const res = await fetch(`/api/users/${user.id}/school`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: selectedSchoolId }),
      });

      const data = await res.json();

      if (data.success) {
        // Reload to refresh Clerk session with new metadata
        window.location.reload();
      } else {
        setLinkError(data.error || "Failed to link school");
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

  if (role !== "teacher") return null;

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
                School Dashboard
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
            Welcome, {user?.firstName || "Coach"}!
          </h2>
          <p className="text-slate-500 mt-1">
            Manage your school&apos;s teams and students.
          </p>
        </div>

        {!schoolId ? (
          /* ── No school linked: show picker ── */
          <div className="bg-white rounded-xl border border-slate-100 p-8 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Link Your School
                </h3>
                <p className="text-sm text-slate-500">
                  Select your school to get started. This is a one-time setup.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select your school
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a school...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.city && s.state ? ` — ${s.city}, ${s.state}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {linkError && (
                <p className="text-sm text-red-600">{linkError}</p>
              )}

              <button
                onClick={handleLinkSchool}
                disabled={!selectedSchoolId || linking}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {linking ? "Linking..." : "Link School"}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Can&apos;t find your school? Contact your NHSBBQA admin.
              </p>
            </div>
          </div>
        ) : loadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          /* ── School linked: show real data ── */
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">My School</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {schoolData?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Teams</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {teams.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {schoolData?.city && schoolData?.state
                        ? `${schoolData.city}, ${schoolData.state}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams List */}
            {teams.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Your Teams</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {team.name}
                          </p>
                          {team.coach && (
                            <p className="text-xs text-slate-500">
                              Coach: {team.coach}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700">
                        {team.division}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No teams registered for your school yet.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
