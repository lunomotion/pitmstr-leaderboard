"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  ChefHat,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Eye,
  ShieldCheck,
} from "lucide-react";

const COMPONENTS = [
  {
    key: "M" as const,
    label: "Mis En Place",
    max: 10,
    description: "Cleanliness, organization, setup, station readiness",
  },
  {
    key: "E" as const,
    label: "Taste (EAT)",
    max: 55,
    description: "Flavor, seasoning, smoke profile, overall taste",
  },
  {
    key: "A" as const,
    label: "Appearance",
    max: 15,
    description: "Visual presentation, color, garnish, appeal",
  },
  {
    key: "T" as const,
    label: "Texture & Tenderness",
    max: 20,
    description: "Bite, moisture, tenderness, consistency",
  },
];

type ComponentKey = "M" | "E" | "A" | "T";
type Step = "entry" | "confirm" | "submitted";

export default function JudgeScoringPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const teamId = params.teamId as string;
  const category = decodeURIComponent(params.category as string)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [step, setStep] = useState<Step>("entry");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [scores, setScores] = useState<Record<ComponentKey, string>>({
    M: "",
    E: "",
    A: "",
    T: "",
  });
  const [judgeId, setJudgeId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function updateScore(component: ComponentKey, value: string) {
    const comp = COMPONENTS.find((c) => c.key === component)!;
    if (
      value === "" ||
      (/^\d{0,2}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= comp.max)
    ) {
      setScores((prev) => ({ ...prev, [component]: value }));
    }
  }

  const runningTotal = COMPONENTS.reduce((sum, comp) => {
    const val = parseFloat(scores[comp.key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Step 1 → Step 2: validate then advance
  function handleReviewScores(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!judgeId.trim()) {
      setError("Please enter your Judge Name");
      return;
    }

    for (const comp of COMPONENTS) {
      const val = parseFloat(scores[comp.key]);
      if (scores[comp.key] === "" || isNaN(val)) {
        setError(`Please enter a score for ${comp.label}`);
        return;
      }
      if (val < 0 || val > comp.max) {
        setError(`${comp.label} must be 0–${comp.max}`);
        return;
      }
    }

    setStep("confirm");
  }

  // Step 3: actual API submission
  async function handleFinalSubmit() {
    setShowFinalConfirm(false);
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/scoring/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          teamId,
          category,
          judgeId: judgeId.trim(),
          scores: {
            M: parseFloat(scores.M),
            E: parseFloat(scores.E),
            A: parseFloat(scores.A),
            T: parseFloat(scores.T),
          },
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to submit scores");
        setStep("confirm");
        return;
      }

      setSubmittedTotal(data.data?.totalScore || runningTotal);
      setStep("submitted");
    } catch {
      setError("Network error — please try again");
      setStep("confirm");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep("entry");
    setShowFinalConfirm(false);
    setScores({ M: "", E: "", A: "", T: "" });
    setNotes("");
    setError(null);
  }

  // ── Header (shared across all steps) ──
  const header = (
    <div className="bg-gradient-to-r from-bbq-red to-red-700 text-white px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ChefHat className="w-8 h-8" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              NHSBBQA® Judge Scoring
            </p>
            <h1 className="text-xl font-bold">{category}</h1>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step: Submitted (success) ──
  if (step === "submitted") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Scores Submitted!
          </h1>
          <p className="text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{category}</span>
          </p>
          <p className="text-3xl font-bold text-slate-900 my-3">
            {submittedTotal}
            <span className="text-lg text-slate-400 font-normal"> / 100</span>
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Judge: {judgeId} — Thank you for judging.
          </p>
          <button
            onClick={resetForm}
            className="text-sm text-americana-blue hover:underline"
          >
            Submit another score
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Confirm Scores ──
  if (step === "confirm") {
    return (
      <div className="min-h-screen bg-slate-50">
        {header}

        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
              <Eye className="w-4 h-4" />
              Step 2 of 3 — Review Your Scores
            </div>
          </div>

          {/* Score summary card */}
          <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Please confirm your scores are correct
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Judge: <span className="font-medium text-slate-700">{judgeId}</span>
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {COMPONENTS.map((comp) => (
                <div key={comp.key} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-bbq-red">
                      {comp.key}
                    </span>
                    <span className="text-sm text-slate-700">
                      {comp.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">
                      {scores[comp.key]}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">
                      / {comp.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Total Score</span>
              <div>
                <span className="text-2xl font-bold text-slate-900">{runningTotal}</span>
                <span className="text-sm text-slate-400 ml-1">/ 100</span>
              </div>
            </div>
          </div>

          {notes.trim() && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{notes}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowFinalConfirm(true)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-bbq-red text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-bbq-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              Confirm &amp; Submit
            </button>

            <button
              type="button"
              onClick={() => { setStep("entry"); setError(null); }}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-3 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back &amp; Edit
            </button>
          </div>

          <p className="text-xs text-center text-slate-400">
            NHSBBQA® M.E.A.T. Scoring | M=10 E=55 A=15 T=20 | Total: 100
          </p>
        </div>

        {/* Step 3: Final confirmation modal */}
        {showFinalConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Are you sure?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                You are submitting a total score of <span className="font-bold text-slate-900">{runningTotal}/100</span> for <span className="font-semibold text-slate-700">{category}</span>. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 px-4 py-2.5 bg-bbq-red text-white rounded-xl font-medium hover:bg-bbq-red/90"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 1: Enter Scores ──
  return (
    <div className="min-h-screen bg-slate-50">
      {header}

      <form onSubmit={handleReviewScores} className="max-w-lg mx-auto p-4 space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            Step 1 of 3 — Enter Scores
          </div>
        </div>

        {/* Judge Name */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Judge Name
          </label>
          <input
            type="text"
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
            placeholder="Enter your name"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bbq-red focus:border-transparent"
            autoFocus
          />
        </div>

        {/* M.E.A.T. Scores */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                M.E.A.T. Scores
              </h2>
              <p className="text-xs text-slate-400">
                Score each component within its range
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {runningTotal}
              </p>
              <p className="text-xs text-slate-400">/ 100</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {COMPONENTS.map((comp) => (
              <div key={comp.key} className="px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-lg font-bold text-bbq-red mr-2">
                      {comp.key}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {comp.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    0–{comp.max} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  {comp.description}
                </p>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={comp.max}
                  step={0.5}
                  value={scores[comp.key]}
                  onChange={(e) => updateScore(comp.key, e.target.value)}
                  placeholder={`0–${comp.max}`}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-bbq-red focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any judging notes..."
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bbq-red focus:border-transparent resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Review button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-bbq-red text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-bbq-red/90 transition-all"
        >
          <Eye className="w-5 h-5" />
          Review Scores
        </button>

        <p className="text-xs text-center text-slate-400">
          NHSBBQA® M.E.A.T. Scoring | M=10 E=55 A=15 T=20 | Total: 100
        </p>
      </form>
    </div>
  );
}
