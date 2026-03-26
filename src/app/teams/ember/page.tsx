import Link from "next/link";
import Header from "@/components/Header";
import DivisionBadge from "@/components/DivisionBadge";
import StateFlag from "@/components/StateFlag";
import {
  ArrowLeft,
  Users,
  School,
  MapPin,
  Trophy,
  User,
  Camera,
  Globe,
  Award,
  Star,
  ImageIcon,
  Handshake,
  Info,
  Flame,
} from "lucide-react";
import { formatStateHSBBQ } from "@/lib/format";

// Hardcoded demo data — no Airtable fetch
const EMBER_TEAM = {
  name: "Team Ember",
  schoolName: "Pitmaster Academy",
  division: "HSBBQ" as const,
  state: "TX",
  captain: "Ember (Mascot)",
  coach: "Coach Hickory",
  bio: "Team Ember represents the spirit of PITMSTR \u2014 passion for barbecue, dedication to craft, and pride in competition. As the official demo team, Ember showcases what every team page looks like when fully built out.",
  address: "1 Pitmaster Lane, BBQ City, TX",
};

const EMBER_MEMBERS = [
  { id: "ember-captain", name: "Ember (Mascot)", role: "Captain" },
  { id: "ember-1", name: "Smokey Jones", role: "Pitmaster" },
  { id: "ember-2", name: "Blaze Williams", role: "Pit Crew" },
  { id: "ember-3", name: "Ash Carter", role: "Pit Crew" },
  { id: "ember-4", name: "Kindle Rivera", role: "Pit Crew" },
];

const EMBER_AWARDS = [
  { id: "award-1", title: "Grand Champion", detail: "Texas State Championship 2025", tier: "state" },
  { id: "award-2", title: "Reserve Champion", detail: "National Championship 2025", tier: "national" },
  { id: "award-3", title: "Best Brisket", detail: "Lone Star Classic 2025", tier: "regional" },
];

export default function EmberDemoPage() {
  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      {/* Demo Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2 text-amber-800 text-sm">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            This is an example team page. It shows what a fully completed team profile looks like on PITMSTR.
          </span>
        </div>
      </div>

      {/* Team Header */}
      <section className="bg-gradient-to-br from-smoke-black to-brisket-brown text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>

          {/* Team info with State Flag */}
          <div className="flex items-start gap-4">
            {/* State Flag */}
            <div className="hidden sm:flex flex-col items-center gap-1 pt-1">
              <StateFlag stateCode={EMBER_TEAM.state} size="lg" />
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">
                {formatStateHSBBQ(EMBER_TEAM.state)}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <DivisionBadge division={EMBER_TEAM.division} />
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <span className="sm:hidden">
                    <StateFlag stateCode={EMBER_TEAM.state} size="sm" />
                  </span>
                  <MapPin className="w-4 h-4 hidden sm:block" />
                  {formatStateHSBBQ(EMBER_TEAM.state)}
                </span>
              </div>

              <h1
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {EMBER_TEAM.name}
              </h1>

              <p className="text-white/80 flex items-center gap-2">
                <School className="w-5 h-5" />
                {EMBER_TEAM.schoolName}
              </p>

              <p className="text-white/60 text-sm mt-2">
                Coach: {EMBER_TEAM.coach}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Team Bio */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            ABOUT
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-6">
            <div className="flex items-start gap-3">
              <Flame className="w-5 h-5 text-bbq-red flex-shrink-0 mt-0.5" />
              <p className="text-smoke-black leading-relaxed">{EMBER_TEAM.bio}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-card-border text-sm text-medium-grey">
              <MapPin className="w-4 h-4" />
              {EMBER_TEAM.address}
            </div>
          </div>
        </section>

        {/* School Card */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            SCHOOL
          </h2>
          <div className="block bg-white rounded-xl border border-card-border p-4">
            <div>
              <h3
                className="font-bold text-smoke-black"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {EMBER_TEAM.schoolName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-medium-grey mt-1">
                <MapPin className="w-4 h-4" />
                <span>BBQ City, TX</span>
              </div>
            </div>
          </div>
        </section>

        {/* Team Members */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            TEAM MEMBERS ({EMBER_MEMBERS.length})
          </h2>

          <div className="bg-white rounded-xl border border-card-border overflow-hidden">
            {EMBER_MEMBERS.map((member, index) => (
              <div
                key={member.id}
                className={`p-4 flex items-center gap-4 ${
                  index < EMBER_MEMBERS.length - 1 ? "border-b border-card-border" : ""
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-light-grey rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-medium-grey" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-smoke-black truncate">
                    {member.name}
                  </p>
                  <p className="text-sm text-bbq-red font-medium">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Awards & Championships */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            AWARDS & CHAMPIONSHIPS
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Regional</p>
                <p className="text-lg font-bold text-slate-900">1</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Award className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">State</p>
                <p className="text-lg font-bold text-slate-900">1</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">National</p>
                <p className="text-lg font-bold text-slate-900">1</p>
              </div>
            </div>

            {/* Award list */}
            <div className="space-y-3">
              {EMBER_AWARDS.map((award) => (
                <div
                  key={award.id}
                  className="flex items-center gap-3 p-3 bg-light-grey rounded-lg"
                >
                  <Trophy className="w-5 h-5 text-gold flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-smoke-black text-sm">{award.title}</p>
                    <p className="text-xs text-medium-grey">{award.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Competition History */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            COMPETITION HISTORY
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gold" />
            <p className="text-smoke-black font-semibold">Coming Soon</p>
            <p className="text-medium-grey text-sm mt-1">
              Competition results and rankings will be displayed here
            </p>
          </div>
        </section>

        {/* Sponsor Graphics */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            TEAM SPONSORS
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-8 text-center">
            <Handshake className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
            <p className="text-smoke-black font-semibold">
              Sponsor space available
            </p>
            <p className="text-medium-grey text-sm mt-1">
              Team sponsor logos and partnerships will be displayed here
            </p>
          </div>
        </section>

        {/* Photo Gallery */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            PHOTO GALLERY
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-8 text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 text-neutral-grey" />
            <p className="text-smoke-black font-semibold">No photos yet</p>
            <p className="text-medium-grey text-sm mt-1">
              Team photos and event highlights will appear here
            </p>
          </div>
        </section>

        {/* Social Media Links */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold text-smoke-black mb-4"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            CONNECT
          </h2>
          <div className="bg-white rounded-xl border border-card-border p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                <Globe className="w-5 h-5" />
              </div>
              <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-medium-grey text-sm text-center mt-3">
              Social media links will be added when the team sets up their
              profile
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-smoke-black text-white py-8 px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-sm text-white/80 font-semibold tracking-wider mb-2"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            EDUCATION. BARBECUE. FAMILY.
          </p>
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} NHSBBQA&reg;. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
