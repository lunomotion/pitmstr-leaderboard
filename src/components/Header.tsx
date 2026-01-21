"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-americana-blue border-b border-americana-blue-light/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center h-20 md:h-24">
          {/* Mobile menu button - left side */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden absolute left-4 p-2 text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Centered Logos */}
          <Link href="/" className="flex items-center gap-4 md:gap-6">
            <Image
              src="/images/nhsbbqa-logo.png"
              alt="NHSBBQA Logo"
              width={120}
              height={80}
              className="h-12 md:h-16 w-auto"
              priority
            />
            <Image
              src="/images/pitmstr-logo.png"
              alt="PITMSTR Logo"
              width={200}
              height={50}
              className="h-10 md:h-14 w-auto"
              priority
            />
          </Link>

          {/* Login button - right side (desktop) */}
          <Link
            href="/login"
            className="hidden md:flex absolute right-6 items-center gap-2 px-4 py-2 bg-bbq-red text-white rounded-lg text-sm font-semibold hover:bg-bbq-red/90 transition-colors"
          >
            <User className="w-4 h-4" />
            Login
          </Link>
        </div>

        {/* Desktop Navigation - centered below logo */}
        <nav className="hidden md:flex items-center justify-center gap-8 pb-4">
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
            href="/schools"
            className="text-sm font-semibold text-white hover:text-bbq-red transition-colors uppercase tracking-wide"
          >
            Schools
          </Link>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-grey/30 animate-slideUp">
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
                href="/schools"
                className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Schools
              </Link>
              <Link
                href="/login"
                className="mx-4 mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-bbq-red text-white rounded-lg text-sm font-semibold hover:bg-bbq-red/90 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
