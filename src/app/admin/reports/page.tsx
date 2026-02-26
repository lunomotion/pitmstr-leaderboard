"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  QrCode,
  Download,
  Printer,
  ChevronDown,
  Loader2,
  Trophy,
  Calendar,
  Users,
  Eye,
} from "lucide-react";

interface EventOption {
  id: string;
  name: string;
  date: string;
  status: string;
  division: string;
  categories: string[];
  registeredTeams?: number;
}

interface TeamOption {
  id: string;
  name: string;
  schoolName?: string;
  state?: string;
}

type ReportType = "event-results" | "qr-sheet" | "qr-bulk";

export default function AdminReportsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("event-results");
  const [teamsPerPage, setTeamsPerPage] = useState<number>(10);
  const [topN, setTopN] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) {
          setEvents(data.data || []);
        }
      } catch {
        setError("Failed to load events");
      } finally {
        setEventsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Fetch teams when event is selected
  useEffect(() => {
    if (!selectedEvent) {
      setTeams([]);
      return;
    }

    async function fetchTeams() {
      setTeamsLoading(true);
      try {
        const res = await fetch(`/api/teams`);
        const data = await res.json();
        if (data.success) {
          setTeams(data.data || []);
        }
      } catch {
        setError("Failed to load teams");
      } finally {
        setTeamsLoading(false);
      }
    }
    fetchTeams();
  }, [selectedEvent]);

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  // Generate and download PDF
  async function generateReport() {
    if (!selectedEvent) {
      setError("Please select an event");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url: string;

      if (reportType === "event-results") {
        const params = new URLSearchParams({
          eventId: selectedEvent,
          teamsPerPage: teamsPerPage.toString(),
          topN: topN.toString(),
        });
        url = `/api/reports/event-results?${params}`;
      } else if (reportType === "qr-sheet") {
        if (!selectedTeam) {
          setError("Please select a team for QR sheet generation");
          setLoading(false);
          return;
        }
        const params = new URLSearchParams({
          eventId: selectedEvent,
          teamId: selectedTeam,
        });
        url = `/api/reports/qr-sheet?${params}`;
      } else {
        // qr-bulk: generate for all teams (open each in new tab)
        for (const team of teams) {
          const params = new URLSearchParams({
            eventId: selectedEvent,
            teamId: team.id,
          });
          window.open(`/api/reports/qr-sheet?${params}`, "_blank");
        }
        setLoading(false);
        return;
      }

      // Open PDF in new tab for preview/download
      window.open(url, "_blank");
    } catch {
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Reports & PDF Generation
        </h1>
        <p className="text-slate-500 mt-1">
          Generate event reports, QR code turn-in sheets, and scoring summaries
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportTypeCard
          icon={Trophy}
          title="Event Results Report"
          description="Full MEAT scoring breakdown with overall and per-category rankings"
          selected={reportType === "event-results"}
          onClick={() => setReportType("event-results")}
        />
        <ReportTypeCard
          icon={QrCode}
          title="QR Turn-In Sheet"
          description="QR code labels for a single team's turn-in boxes at an event"
          selected={reportType === "qr-sheet"}
          onClick={() => setReportType("qr-sheet")}
        />
        <ReportTypeCard
          icon={Printer}
          title="Bulk QR Sheets"
          description="Generate QR turn-in sheets for all teams at an event"
          selected={reportType === "qr-bulk"}
          onClick={() => setReportType("qr-bulk")}
        />
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Configure Report
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1.5 text-slate-400" />
              Select Event
            </label>
            {eventsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading events...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setSelectedTeam("");
                  }}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} — {event.date} ({event.status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Event Info */}
          {selectedEventData && (
            <div className="bg-slate-50 rounded-lg p-4 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-slate-400">Division:</span>{" "}
                <span className="font-medium text-slate-700">
                  {selectedEventData.division}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Categories:</span>{" "}
                <span className="font-medium text-slate-700">
                  {selectedEventData.categories?.join(", ") || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Teams:</span>{" "}
                <span className="font-medium text-slate-700">
                  {selectedEventData.registeredTeams || "—"}
                </span>
              </div>
            </div>
          )}

          {/* Team Selection (for QR sheet) */}
          {reportType === "qr-sheet" && selectedEvent && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="inline w-4 h-4 mr-1.5 text-slate-400" />
                Select Team
              </label>
              {teamsLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading teams...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
                  >
                    <option value="">Choose a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                        {team.schoolName ? ` — ${team.schoolName}` : ""}
                        {team.state ? ` (${team.state})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Event Report Options */}
          {reportType === "event-results" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Teams Per Page
                </label>
                <div className="flex gap-2">
                  {[5, 10, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTeamsPerPage(n)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                        teamsPerPage === n
                          ? "bg-americana-blue text-white border-americana-blue"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Show Top N Teams (0 = All)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={topN}
                  onChange={(e) =>
                    setTopN(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Set to 5, 10, etc. to show only top performers. 0 shows all
                  teams.
                </p>
              </div>
            </div>
          )}

          {/* Bulk info */}
          {reportType === "qr-bulk" && selectedEvent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Bulk generation</strong> will open a new tab for each
                team&apos;s QR sheet ({teams.length} teams). Make sure your
                browser allows pop-ups for this site.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex items-center justify-between border-t border-slate-100">
          <p className="text-xs text-slate-400">
            PDFs are generated on-demand using the NHSBBQA® M.E.A.T. Scoring
            System
          </p>

          <div className="flex gap-3">
            <button
              onClick={generateReport}
              disabled={loading || !selectedEvent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-americana-blue text-white rounded-lg text-sm font-medium hover:bg-americana-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Preview PDF
            </button>
            <button
              onClick={generateReport}
              disabled={loading || !selectedEvent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bbq-red text-white rounded-lg text-sm font-medium hover:bg-bbq-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Generate & Download
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          M.E.A.T. Scoring Reference
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-bbq-red">M</div>
            <div className="text-xs text-slate-500 mt-1">Mis en Place</div>
            <div className="text-sm font-semibold text-slate-700">10%</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-bbq-red">E</div>
            <div className="text-xs text-slate-500 mt-1">EAT (Taste)</div>
            <div className="text-sm font-semibold text-slate-700">50%</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-bbq-red">A</div>
            <div className="text-xs text-slate-500 mt-1">Appearance</div>
            <div className="text-sm font-semibold text-slate-700">20%</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-bbq-red">T</div>
            <div className="text-xs text-slate-500 mt-1">Texture</div>
            <div className="text-sm font-semibold text-slate-700">20%</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <p>6 judges per category • Lowest score dropped • Remaining 5 averaged</p>
          <p>
            Tie-break priority: Event Total → EAT Total → Texture → Appearance →
            Ribs → Chicken
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReportTypeCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-xl border-2 transition-all ${
        selected
          ? "border-americana-blue bg-americana-blue/5 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <Icon
        className={`w-6 h-6 mb-3 ${
          selected ? "text-americana-blue" : "text-slate-400"
        }`}
      />
      <h3
        className={`text-sm font-semibold mb-1 ${
          selected ? "text-americana-blue" : "text-slate-900"
        }`}
      >
        {title}
      </h3>
      <p className="text-xs text-slate-500">{description}</p>
    </button>
  );
}
