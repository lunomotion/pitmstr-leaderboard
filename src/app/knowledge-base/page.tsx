"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";

type FilterType =
  | "all"
  | "admin"
  | "legal"
  | "cte"
  | "coach"
  | "student"
  | "parent"
  | "volunteer"
  | "host"
  | "sponsor";

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  tags: FilterType[];
  section: string;
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins & Boards" },
  { value: "legal", label: "Legal & HR" },
  { value: "cte", label: "CTE & Teachers" },
  { value: "coach", label: "Coaches & Mentors" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
  { value: "volunteer", label: "Volunteers" },
  { value: "host", label: "Event Hosts" },
  { value: "sponsor", label: "Sponsors & Partners" },
];

const faqData: FAQItem[] = [
  // SECTION: Admins & Boards
  {
    id: "faq-what-is-nhsbbqa",
    question: "What is the National High School BBQ Association (NHSBBQA)?",
    tags: ["admin", "cte", "sponsor"],
    section: "Admins & School Boards",
    answer: (
      <>
        <p>
          NHSBBQA is an <strong>education-centered, voluntary, extracurricular</strong> competition and learning ecosystem that uses live-fire cooking,
          barbecue, grilling, and outdoor culinary skills to build workforce readiness, leadership, and community pride.
        </p>
        <ul className="list-disc ml-5 mt-3 space-y-1">
          <li><strong>What you get:</strong> optional instructional resources, competition pathways, safety frameworks, and event standards.</li>
          <li><strong>What you keep:</strong> local control, supervision, safety authority, and participation approval.</li>
        </ul>
      </>
    ),
  },
  {
    id: "faq-allowed",
    question: "Why is NHSBBQA allowed for public schools?",
    tags: ["admin", "legal", "cte"],
    section: "Admins & School Boards",
    answer: (
      <>
        <p>
          Schools and districts routinely participate in <strong>voluntary extracurricular</strong> programs and academic competitions (robotics, STEM leagues,
          industry certification programs, culinary invitationals). NHSBBQA is positioned in that same category:
          <strong> not a CTSO, not a credit-bearing program, and not a curriculum authority</strong>.
        </p>
        <p className="mt-3">
          Participation is approved locally under district policy—just like travel teams, UIL-adjacent programs, and other sanctioned contests.
        </p>
      </>
    ),
  },
  {
    id: "faq-safety-authority",
    question: "Who controls safety, supervision, and rules at an event?",
    tags: ["admin", "legal", "host"],
    section: "Admins & School Boards",
    answer: (
      <>
        <div className="border-l-4 border-americana-blue bg-americana-blue/5 p-4 rounded-r-lg mb-3">
          <strong>All safety authority remains with the local school district, host organization, or venue.</strong>
          NHSBBQA does not supersede local policies.
        </div>
        <ul className="list-disc ml-5 space-y-1">
          <li>District-approved adults supervise students.</li>
          <li>Hosts follow local fire code, district policy, and venue requirements.</li>
          <li>NHSBBQA provides standards and best-practice guidance.</li>
        </ul>
      </>
    ),
  },
  {
    id: "faq-ctso",
    question: "Is NHSBBQA a CTSO (Career and Technical Student Organization)?",
    tags: ["admin", "legal", "cte"],
    section: "Admins & School Boards",
    answer: (
      <p>
        No. NHSBBQA is <strong>not a CTSO</strong>. We do not claim state CTSO designation, do not confer academic credit,
        and do not replace CTSOs. Many schools integrate NHSBBQA alongside FCCLA, FFA, SkillsUSA, ProStart, FBLA, and others.
      </p>
    ),
  },
  {
    id: "faq-perkins",
    question: "Does NHSBBQA align to CTE / TEKS / Perkins V?",
    tags: ["admin", "cte", "legal"],
    section: "Admins & School Boards",
    answer: (
      <>
        <p>
          Yes—NHSBBQA is commonly aligned to Culinary Arts, Food Science, Agriculture, Entrepreneurship, and employability skills.
          We provide optional crosswalk language and outcomes framing for district documentation.
        </p>
        <p className="text-sm text-medium-grey mt-3">
          Districts determine local compliance and funding decisions. NHSBBQA does not administer Perkins funds.
        </p>
      </>
    ),
  },
  {
    id: "faq-impact",
    question: "What outcomes should a superintendent or board expect?",
    tags: ["admin", "sponsor"],
    section: "Admins & School Boards",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Higher student engagement through project-based, real-world performance tasks</li>
        <li>Career exploration across culinary, ag, welding, marketing, and entrepreneurship</li>
        <li>Community pride (events, school spirit, local partnerships)</li>
        <li>Workforce skills: teamwork, time management, food safety, communication, professionalism</li>
      </ul>
    ),
  },
  {
    id: "faq-cost",
    question: "What does it cost a school to participate?",
    tags: ["admin", "cte"],
    section: "Admins & School Boards",
    answer: (
      <>
        <p>
          Costs vary by participation level (team membership, regional events, travel). Most schools fund programs through a blend of:
          <strong> CTE budgets, fundraising, booster support, sponsorships, and in-kind donations</strong>.
        </p>
        <p className="text-sm text-medium-grey mt-3">
          Publish your pricing transparently on a &quot;Participation & Fees&quot; page and link it here for one-click board review.
        </p>
      </>
    ),
  },
  {
    id: "faq-onboarding",
    question: "How does a school or district onboard?",
    tags: ["admin", "cte", "legal"],
    section: "Admins & School Boards",
    answer: (
      <ol className="list-decimal ml-5 space-y-2">
        <li><strong>District approval:</strong> principal/CTE director confirms extracurricular participation per local policy.</li>
        <li><strong>Safety alignment:</strong> designate a Local Host Risk Officer for hosted events; adopt the Emergency Response Plan template.</li>
        <li><strong>Team setup:</strong> coach/teacher registers team, adds roster, and completes required acknowledgements.</li>
        <li><strong>Training:</strong> student + adult safety orientation; food safety expectations set locally.</li>
        <li><strong>Compete:</strong> regional → state → national pathway (as applicable).</li>
      </ol>
    ),
  },

  // SECTION: Legal & HR
  {
    id: "faq-liability",
    question: "Who holds liability and who supervises students?",
    tags: ["legal", "admin"],
    section: "Legal & HR",
    answer: (
      <p>
        Students are supervised by <strong>district-approved adults</strong> under local policy. Hosts operate under their venue rules and district procedures.
        NHSBBQA provides competition standards and guidance but does not supervise students or operate equipment.
      </p>
    ),
  },
  {
    id: "faq-waivers",
    question: "Do you require waivers or background checks?",
    tags: ["legal", "admin"],
    section: "Legal & HR",
    answer: (
      <p>
        Districts and venues determine waivers and volunteer screening under local policy.
        NHSBBQA supports districts with best-practice templates and recommends aligning to existing district volunteer procedures.
      </p>
    ),
  },
  {
    id: "faq-privacy",
    question: "How do you handle student data and privacy?",
    tags: ["legal", "admin", "cte"],
    section: "Legal & HR",
    answer: (
      <>
        <p>
          NHSBBQA collects only the information needed for team registration and competition operations.
          Districts control student participation and media permissions under local policy.
        </p>
        <p className="text-sm text-medium-grey mt-3">
          Add links here to your Privacy Policy, Photo/Video Release guidance, and data retention statement.
        </p>
      </>
    ),
  },
  {
    id: "faq-fire-code",
    question: "How do you ensure compliance with fire codes and safety regulations?",
    tags: ["legal", "admin", "host"],
    section: "Legal & HR",
    answer: (
      <>
        <p>Compliance is governed locally by the hosting district and venue. NHSBBQA requires:</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Local Host Risk Officer (district-approved adult)</li>
          <li>Written Emergency Response Plan</li>
          <li>Adherence to district policy, venue rules, and local fire code</li>
        </ul>
      </>
    ),
  },

  // SECTION: CTE & Teachers
  {
    id: "faq-classroom",
    question: "How does NHSBBQA fit inside a CTE classroom?",
    tags: ["cte", "admin"],
    section: "CTE Directors & Teachers",
    answer: (
      <p>
        Many programs use NHSBBQA as a <strong>project-based learning capstone</strong> or an extracurricular extension to culinary, food science, ag, and entrepreneurship.
        Teachers remain the instructional authority; NHSBBQA provides optional frameworks and competition-aligned performance tasks.
      </p>
    ),
  },
  {
    id: "faq-grades",
    question: "Do competitions affect grades or course credit?",
    tags: ["cte"],
    section: "CTE Directors & Teachers",
    answer: (
      <p>
        No. Competition participation is extracurricular unless the district chooses to integrate activities as optional class projects.
        NHSBBQA does not issue credit or set grading policies.
      </p>
    ),
  },
  {
    id: "faq-training",
    question: "What training is recommended for coaches and students?",
    tags: ["cte", "coach"],
    section: "CTE Directors & Teachers",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Live-fire safety orientation (local policy)</li>
        <li>Food safety expectations (district standard)</li>
        <li>Knife safety + sanitation procedures</li>
        <li>Team roles, timelines, and communication routines</li>
      </ul>
    ),
  },

  // SECTION: Coaches & Mentors
  {
    id: "faq-team-size",
    question: "What does a team look like (size, roles, responsibilities)?",
    tags: ["coach", "cte"],
    section: "Coaches & Mentors",
    answer: (
      <p>
        Teams are typically structured with clear roles (fire management, prep, cook, presentation, cleanup, documentation). Exact formats vary by event category and local program design.
      </p>
    ),
  },
  {
    id: "faq-travel",
    question: "How do travel, supervision, and chaperones work?",
    tags: ["coach", "admin"],
    section: "Coaches & Mentors",
    answer: (
      <p>
        Travel and supervision follow district policy. NHSBBQA competitions function like other sanctioned student events where local approval, chaperone ratios, and permissions are managed by the school.
      </p>
    ),
  },

  // SECTION: Students
  {
    id: "faq-student-join",
    question: "Do I have to be a \"cook\" to join?",
    tags: ["student"],
    section: "Students",
    answer: (
      <p>
        No. Teams need students with many strengths: leadership, prep, timekeeping, safety, marketing, photography/video, presentation, and logistics. If you&apos;re motivated, there&apos;s a role for you.
      </p>
    ),
  },
  {
    id: "faq-student-learn",
    question: "What skills will I learn?",
    tags: ["student"],
    section: "Students",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Live-fire fundamentals and safe operations (with adult supervision)</li>
        <li>Food safety and sanitation habits</li>
        <li>Teamwork, planning, and time management</li>
        <li>Communication and professionalism</li>
      </ul>
    ),
  },

  // SECTION: Parents
  {
    id: "faq-parent-safety",
    question: "Is this safe for my student?",
    tags: ["parent", "legal"],
    section: "Parents",
    answer: (
      <p>
        Safety is controlled locally by your school and district. Students participate under adult supervision with district-aligned safety rules.
        Events require a Local Host Risk Officer and a written Emergency Response Plan.
      </p>
    ),
  },
  {
    id: "faq-parent-help",
    question: "How can parents help?",
    tags: ["parent", "volunteer"],
    section: "Parents",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Volunteer under district procedures</li>
        <li>Help with fundraising and sponsor outreach</li>
        <li>Support travel logistics and team meals</li>
        <li>Assist with documentation, photos, and event setup</li>
      </ul>
    ),
  },

  // SECTION: Volunteers
  {
    id: "faq-volunteer-qualify",
    question: "How do I become an approved volunteer?",
    tags: ["volunteer", "legal"],
    section: "Volunteers",
    answer: (
      <p>
        Volunteers are approved through local school/district procedures. NHSBBQA recommends aligning to existing district volunteer onboarding, screening, and supervision rules.
      </p>
    ),
  },
  {
    id: "faq-volunteer-roles",
    question: "What volunteer roles exist at events?",
    tags: ["volunteer", "host"],
    section: "Volunteers",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Check-in and team support</li>
        <li>Safety support (under Host Risk Officer)</li>
        <li>Runner / logistics</li>
        <li>Turn-in table support</li>
        <li>Awards and stage support</li>
      </ul>
    ),
  },

  // SECTION: Event Hosts
  {
    id: "faq-host-requirements",
    question: "What is required to host an NHSBBQA event?",
    tags: ["host", "legal", "admin"],
    section: "Event Hosts",
    answer: (
      <ul className="list-disc ml-5 space-y-1">
        <li>Local Host Risk Officer (required)</li>
        <li>Emergency Response Plan (required)</li>
        <li>Venue approval, fire code alignment, and district/venue insurance requirements</li>
        <li>Clear equipment spacing, safety zones, and accessible emergency routes</li>
      </ul>
    ),
  },
  {
    id: "faq-host-erp",
    question: "What must be included in the Emergency Response Plan?",
    tags: ["host"],
    section: "Event Hosts",
    answer: (
      <p>
        Venue address, nearest hospital, emergency contacts, severe weather plan, fire response steps, incident reporting process,
        and who has authority to pause/stop activities (local host/district).
      </p>
    ),
  },

  // SECTION: Sponsors & Partners
  {
    id: "faq-sponsor-why",
    question: "Why partner with NHSBBQA?",
    tags: ["sponsor", "admin"],
    section: "Sponsors & Partners",
    answer: (
      <p>
        Partners support student success, workforce readiness, and community pride—while engaging families, schools, and future consumers.
        Sponsorship can include cash, product, scholarships, equipment, and activation experiences.
      </p>
    ),
  },
  {
    id: "faq-sponsor-brand",
    question: "How is brand use, signage, and content handled?",
    tags: ["sponsor", "legal"],
    section: "Sponsors & Partners",
    answer: (
      <p>
        Partner branding follows a documented brand guide and event-specific activation rules.
        Schools and districts may have additional restrictions; NHSBBQA respects local policies and student privacy requirements.
      </p>
    ),
  },
];

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Handle hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setExpandedItems(new Set([hash]));
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, []);

  const filteredFAQs = useMemo(() => {
    return faqData.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.tags.includes(activeFilter);
      const matchesSearch =
        searchQuery === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const groupedFAQs = useMemo(() => {
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = [];
      }
      groups[item.section].push(item);
    });
    return groups;
  }, [filteredFAQs]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Update URL hash
      window.history.replaceState(null, "", `#${id}`);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredFAQs.map((item) => item.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className="min-h-screen bg-light-grey">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl text-smoke-black mb-2">
            NHSBBQA Knowledge Base
          </h1>
          <p className="text-medium-grey">
            Search answers by role: administrators, teachers, coaches, students, parents, volunteers, sponsors, partners, and hosts.
          </p>
        </header>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-card-border p-4 mb-6">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-medium-grey" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search: safety, Perkins, TEKS, liability, cost, eligibility..."
              className="w-full pl-12 pr-10 py-3 border border-neutral-grey rounded-xl focus:outline-none focus:ring-2 focus:ring-americana-blue focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-medium-grey hover:text-smoke-black"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeFilter === option.value
                    ? "bg-americana-blue text-white border-americana-blue"
                    : "bg-white text-smoke-black border-neutral-grey hover:border-americana-blue"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Meta Controls */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-medium-grey">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? "result" : "results"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 border border-neutral-grey rounded-lg hover:border-americana-blue transition-colors"
              >
                Expand all
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 border border-neutral-grey rounded-lg hover:border-americana-blue transition-colors"
              >
                Collapse all
              </button>
            </div>
          </div>
        </div>

        {/* Quick Path Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-card-border p-5">
            <h3 className="font-heading text-lg text-smoke-black mb-3">
              New here? Start with the decision path.
            </h3>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>
                <button
                  onClick={() => {
                    setExpandedItems(new Set(["faq-what-is-nhsbbqa"]));
                    document.getElementById("faq-what-is-nhsbbqa")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-americana-blue hover:underline text-left"
                >
                  What is NHSBBQA?
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setExpandedItems(new Set(["faq-allowed"]));
                    document.getElementById("faq-allowed")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-americana-blue hover:underline text-left"
                >
                  Why is this allowed for public schools?
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setExpandedItems(new Set(["faq-safety-authority"]));
                    document.getElementById("faq-safety-authority")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-americana-blue hover:underline text-left"
                >
                  Who controls safety and supervision?
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setExpandedItems(new Set(["faq-cost"]));
                    document.getElementById("faq-cost")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-americana-blue hover:underline text-left"
                >
                  What does it cost?
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setExpandedItems(new Set(["faq-onboarding"]));
                    document.getElementById("faq-onboarding")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-americana-blue hover:underline text-left"
                >
                  How do we onboard a school or district?
                </button>
              </li>
            </ol>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-card-border p-5">
            <h3 className="font-heading text-lg text-smoke-black mb-3">
              Need a board-ready answer fast?
            </h3>
            <p className="text-sm text-smoke-black mb-3">
              Most approvals come down to: <strong>local control</strong>, <strong>safety framework</strong>,
              <strong> liability clarity</strong>, <strong>educational value</strong>, and <strong>transparent costs</strong>.
            </p>
            <p className="text-xs text-medium-grey">
              NHSBBQA provides standards and guidance; <strong>all safety authority remains with the local district</strong>.
            </p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([section, items]) => (
            <section key={section}>
              <h2 className="font-heading text-xl text-smoke-black mb-4 pb-2 border-b border-neutral-grey">
                {section}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="bg-white rounded-xl border border-card-border overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-light-grey/50 transition-colors"
                      aria-expanded={expandedItems.has(item.id)}
                    >
                      <span className="font-semibold text-smoke-black">
                        {item.question}
                      </span>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="w-5 h-5 text-medium-grey flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-medium-grey flex-shrink-0" />
                      )}
                    </button>
                    {expandedItems.has(item.id) && (
                      <div className="px-4 pb-4 pt-0 border-t border-card-border bg-light-grey/30 text-smoke-black text-sm leading-relaxed animate-fadeIn">
                        <div className="pt-4">{item.answer}</div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Empty State */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-medium-grey">No results found. Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-neutral-grey text-center">
          <p className="text-medium-grey text-sm">
            Still need help? Contact us for district onboarding support and board-ready documentation.
          </p>
        </footer>
      </main>
    </div>
  );
}
