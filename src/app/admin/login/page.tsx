"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-americana-blue via-americana-blue to-[#1e2a5e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/backgrounds/bg-smoke.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 bg-white rounded-2xl p-2 shadow-xl">
                <Image
                  src="/images/nhsbbqa-logo.png"
                  alt="NHSBBQA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="font-heading text-2xl text-white">PITMSTR</h1>
                <p className="text-white/60 text-sm">Admin Portal</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <blockquote className="text-2xl font-medium text-white leading-relaxed">
              &ldquo;Where Dreams Ignite&rdquo;
            </blockquote>
            <p className="text-white/70">
              Manage competitions, teams, and schools for the National High
              School BBQ Association.
            </p>
          </div>

          <div className="flex items-center gap-3 text-white/50 text-sm">
            <span>NHSBBQA</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>National High School BBQ Association</span>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/4 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-americana-blue rounded-xl p-1.5">
              <Image
                src="/images/nhsbbqa-logo.png"
                alt="NHSBBQA"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-heading text-lg text-slate-900">PITMSTR</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>

            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500">
                Enter your password to access the admin dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-americana-blue text-white rounded-xl font-medium hover:bg-americana-blue/90 focus:outline-none focus:ring-2 focus:ring-americana-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-americana-blue/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Need access?{" "}
              <a
                href="mailto:admin@nhsbbqa.org"
                className="text-americana-blue hover:underline"
              >
                Contact your administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-slate-400">
          <p>NHSBBQA Admin Portal</p>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-americana-blue" />
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
