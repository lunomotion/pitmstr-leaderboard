import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Clock, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PendingPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-[var(--light-grey)] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Account Pending Approval
          </h1>

          <p className="text-slate-500 mb-6">
            Hi {user?.firstName || "there"}! Your account has been created
            successfully. An NHSBBQA administrator will review and activate your
            account shortly.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Email:</span>{" "}
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              You&apos;ll be notified once your account is activated.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--americana-blue)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Leaderboard
            </Link>

            <SignOutButton redirectUrl="/">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
