import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Trophy, Calendar, Star, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Role } from "@/lib/roles";

export default async function StudentParentDashboard() {
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as
    | Record<string, unknown>
    | undefined;
  const role = metadata?.role as Role | undefined;

  // Only students and parents can access this page
  if (role !== "student" && role !== "parent") redirect("/dashboard");

  const user = await currentUser();
  const isParent = role === "parent";

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
              ? "Track your student's team and competition results."
              : "Track your team and competition results."}
          </p>
        </div>

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
                  Not linked yet
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
                <p className="text-sm text-slate-400">Upcoming Events</p>
                <p className="text-lg font-semibold text-slate-900">—</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Best Score</p>
                <p className="text-lg font-semibold text-slate-900">—</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
          <p>
            Your admin will link your account to your team. Check the{" "}
            <Link href="/leaderboard" className="text-[var(--americana-blue)] hover:underline">
              leaderboard
            </Link>{" "}
            for live scores!
          </p>
        </div>
      </main>
    </div>
  );
}
