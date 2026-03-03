"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  ChefHat,
  Loader2,
  CheckCircle2,
  AlertCircle,
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

export default function JudgeScoringPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const teamId = params.teamId as string;
  const category = decodeURIComponent(params.category as string)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const [scores, setScores] = useState<Record<ComponentKey, string>>({
    M: "",
    E: "",
    A: "",
    T: "",
  });
  const [judgeId, setJudgeId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  // Calculate running total
  const runningTotal = COMPONENTS.reduce((sum, comp) => {
    const val = parseFloat(scores[comp.key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!judgeId.trim()) {
      setError("Please enter your Judge Name");
      return;
    }

    // Validate all scores are filled and within range
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
        return;
      }

      setSubmittedTotal(data.data?.totalScore || runningTotal);
      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
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
            onClick={() => {
              setSubmitted(false);
              setScores({ M: "", E: "", A: "", T: "" });
              setNotes("");
            }}
            className="text-sm text-americana-blue hover:underline"
          >
            Submit another score
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4">
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

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-bbq-red text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-bbq-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          Submit Scores
        </button>

        <p className="text-xs text-center text-slate-400">
          NHSBBQA® M.E.A.T. Scoring | M=10 E=55 A=15 T=20 | Total: 100
        </p>
      </form>
    </div>
  );
}
