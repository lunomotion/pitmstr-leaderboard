"use client";

import { Radio, ExternalLink, Signal } from "lucide-react";

export default function LFHQRadioPage() {
  // TODO: Replace with actual radio station dashboard URL once provided by Mike
  const RADIO_DASHBOARD_URL = "#";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-americana-blue/10 rounded-xl">
            <Radio className="w-7 h-7 text-americana-blue" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            LIVE FIRE HQ
          </h1>
        </div>
        <p className="text-lg text-slate-500 font-medium">
          LFHQ Radio Station Dashboard
        </p>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-slate-600 leading-relaxed">
          Access the Live Fire HQ Radio station dashboard to manage music,
          announcements, and event scheduling.
        </p>
      </div>

      {/* Launch Button */}
      <a
        href={RADIO_DASHBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-americana-blue hover:bg-americana-blue/90 text-white text-lg font-semibold rounded-xl shadow-lg shadow-americana-blue/20 transition-all duration-200 hover:shadow-xl hover:shadow-americana-blue/30"
      >
        <Radio className="w-6 h-6" />
        Open Radio Dashboard
        <ExternalLink className="w-5 h-5 opacity-70" />
      </a>

      {/* Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Signal className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">
              Station Status
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Awaiting Link
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          The radio station dashboard link will be provided by the station
          provider. Once available, this page will link directly to the live
          dashboard.
        </p>
      </div>
    </div>
  );
}
