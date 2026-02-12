"use client";

import Link from "next/link";
import { Menu, X, User, LogIn } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-smoke-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Mobile menu button - left side */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop Navigation - centered */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            <Link
              href="/"
              className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
            >
              Home
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
            >
              Leaderboard
            </Link>
            <Link
              href="/events"
              className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
            >
              Events
            </Link>
            <Link
              href="/teams"
              className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
            >
              Teams
            </Link>
            <Link
              href="/knowledge-base"
              className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
            >
              Knowledge Base
            </Link>
          </nav>

          {/* Sign In / Dashboard button - right side (desktop) */}
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-in"}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-bbq-red text-white rounded-lg text-sm font-semibold hover:bg-bbq-red/90 transition-colors"
          >
            {isSignedIn ? (
              <>
                <User className="w-4 h-4" />
                Dashboard
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </Link>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-slideUp">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/events"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/teams"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Teams
              </Link>
              <Link
                href="/knowledge-base"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Knowledge Base
              </Link>
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-in"}
                className="mx-4 mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-bbq-red text-white rounded-lg text-sm font-semibold hover:bg-bbq-red/90 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isSignedIn ? (
                  <>
                    <User className="w-4 h-4" />
                    Dashboard
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
