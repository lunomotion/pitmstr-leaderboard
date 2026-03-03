/**
 * PITMSTR Demo Data Seed Script
 *
 * Seeds Airtable with realistic demo data:
 * - 8 states
 * - 2 divisions (HSBBQ, MSBBQ)
 * - 6 food categories
 * - 12 schools across states
 * - 25 teams
 * - 5 events (mix of upcoming, live, completed)
 * - Sample turn-in scores for completed events
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Requires AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env.local
 */

import Airtable from "airtable";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local");
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

// ---------------------------------------------------------------------------
// Demo Data Definitions
// ---------------------------------------------------------------------------

const DEMO_STATES = [
  { name: "Texas", abbreviation: "TX" },
  { name: "North Carolina", abbreviation: "NC" },
  { name: "Tennessee", abbreviation: "TN" },
  { name: "Georgia", abbreviation: "GA" },
  { name: "Missouri", abbreviation: "MO" },
  { name: "Kansas", abbreviation: "KS" },
  { name: "South Carolina", abbreviation: "SC" },
  { name: "Alabama", abbreviation: "AL" },
];

const DEMO_DIVISIONS = [
  { name: "HSBBQ" },
  { name: "MSBBQ" },
];

const DEMO_CATEGORIES = [
  { name: "Brisket" },
  { name: "Chicken" },
  { name: "Pork" },
  { name: "St. Louis Ribs" },
  { name: "Chili" },
  { name: "Grilled Cheese" },
];

const DEMO_SCHOOLS = [
  { name: "DEMO - Taylor High School", city: "Taylor", state: "TX" },
  { name: "DEMO - Lockhart Academy", city: "Lockhart", state: "TX" },
  { name: "DEMO - Austin BBQ Prep", city: "Austin", state: "TX" },
  { name: "DEMO - Lexington High School", city: "Lexington", state: "NC" },
  { name: "DEMO - Charlotte CTE Academy", city: "Charlotte", state: "NC" },
  { name: "DEMO - Memphis Culinary High", city: "Memphis", state: "TN" },
  { name: "DEMO - Nashville Prep School", city: "Nashville", state: "TN" },
  { name: "DEMO - Atlanta Metro Academy", city: "Atlanta", state: "GA" },
  { name: "DEMO - Kansas City Technical", city: "Kansas City", state: "MO" },
  { name: "DEMO - Wichita South High", city: "Wichita", state: "KS" },
  { name: "DEMO - Charleston Academy", city: "Charleston", state: "SC" },
  { name: "DEMO - Birmingham Central High", city: "Birmingham", state: "AL" },
];

const DEMO_TEAMS = [
  { name: "DEMO - Texas Smoke Kings", school: 0, state: "TX", division: "HSBBQ", coach: "Coach Martinez" },
  { name: "DEMO - Lone Star Grillers", school: 1, state: "TX", division: "HSBBQ", coach: "Coach Thompson" },
  { name: "DEMO - Austin Pit Crew", school: 2, state: "TX", division: "HSBBQ", coach: "Coach Williams" },
  { name: "DEMO - Texas Jr. Pitmasters", school: 0, state: "TX", division: "MSBBQ", coach: "Coach Lee" },
  { name: "DEMO - Carolina Smoke Squad", school: 3, state: "NC", division: "HSBBQ", coach: "Coach Davis" },
  { name: "DEMO - Queen City BBQ Crew", school: 4, state: "NC", division: "HSBBQ", coach: "Coach Johnson" },
  { name: "DEMO - Memphis Fire Starters", school: 5, state: "TN", division: "HSBBQ", coach: "Coach Brown" },
  { name: "DEMO - Music City Smokers", school: 6, state: "TN", division: "HSBBQ", coach: "Coach Wilson" },
  { name: "DEMO - Nashville Jr. Grillers", school: 6, state: "TN", division: "MSBBQ", coach: "Coach Adams" },
  { name: "DEMO - Peach State Pit Bosses", school: 7, state: "GA", division: "HSBBQ", coach: "Coach Clark" },
  { name: "DEMO - ATL Smoke Show", school: 7, state: "GA", division: "HSBBQ", coach: "Coach Miller" },
  { name: "DEMO - KC BBQ Academy", school: 8, state: "MO", division: "HSBBQ", coach: "Coach Taylor" },
  { name: "DEMO - Gateway Grillers", school: 8, state: "MO", division: "HSBBQ", coach: "Coach Anderson" },
  { name: "DEMO - Wichita Heat Wave", school: 9, state: "KS", division: "HSBBQ", coach: "Coach Thomas" },
  { name: "DEMO - Sunflower Smokers", school: 9, state: "KS", division: "MSBBQ", coach: "Coach Jackson" },
  { name: "DEMO - Lowcountry Legends", school: 10, state: "SC", division: "HSBBQ", coach: "Coach White" },
  { name: "DEMO - Palmetto Pit Crew", school: 10, state: "SC", division: "HSBBQ", coach: "Coach Harris" },
  { name: "DEMO - Iron City Smokers", school: 11, state: "AL", division: "HSBBQ", coach: "Coach Martin" },
  { name: "DEMO - Bama BBQ Brigade", school: 11, state: "AL", division: "HSBBQ", coach: "Coach Garcia" },
  { name: "DEMO - Birmingham Jr. Flames", school: 11, state: "AL", division: "MSBBQ", coach: "Coach Robinson" },
  { name: "DEMO - Central Texas Elite", school: 1, state: "TX", division: "HSBBQ", coach: "Coach Moore" },
  { name: "DEMO - Smoky Mountain Crew", school: 5, state: "TN", division: "HSBBQ", coach: "Coach Walker" },
  { name: "DEMO - Piedmont Pitmasters", school: 3, state: "NC", division: "HSBBQ", coach: "Coach Young" },
  { name: "DEMO - Bluegrass Grillers", school: 4, state: "NC", division: "MSBBQ", coach: "Coach Allen" },
  { name: "DEMO - Heartland BBQ Co.", school: 8, state: "MO", division: "HSBBQ", coach: "Coach King" },
];

const DEMO_EVENTS = [
  {
    name: "DEMO - Texas State Championship",
    date: "2026-04-15",
    location: "Taylor, TX",
    state: "TX",
    division: "HSBBQ",
    categories: [0, 1, 2, 3], // Brisket, Chicken, Pork, Ribs
    teams: [0, 1, 2, 20], // Texas teams
  },
  {
    name: "DEMO - Southeast Regional Invitational",
    date: "2026-03-20",
    location: "Charlotte, NC",
    state: "NC",
    division: "HSBBQ",
    categories: [0, 1, 2],
    teams: [4, 5, 9, 10, 15, 16, 22],
  },
  {
    name: "DEMO - Heartland BBQ Classic",
    date: "2026-02-15",
    location: "Kansas City, MO",
    state: "MO",
    division: "HSBBQ",
    categories: [0, 1, 2, 3, 4],
    teams: [11, 12, 13, 24],
  },
  {
    name: "DEMO - Music City Showdown",
    date: "2026-03-01",
    location: "Nashville, TN",
    state: "TN",
    division: "HSBBQ",
    categories: [0, 1, 2],
    teams: [6, 7, 21, 17, 18],
  },
  {
    name: "DEMO - Junior Pitmaster Showcase",
    date: "2026-05-10",
    location: "Austin, TX",
    state: "TX",
    division: "MSBBQ",
    categories: [1, 4, 5], // Chicken, Chili, Grilled Cheese
    teams: [3, 8, 14, 19, 23],
  },
];

// ---------------------------------------------------------------------------
// Seed Functions
// ---------------------------------------------------------------------------

type RecordMap = Map<number, string>; // index -> Airtable record ID

async function seedStates(): Promise<RecordMap> {
  console.log("Seeding states...");
  const map: RecordMap = new Map();

  // Check for existing states first
  const existing = await base("States").select().all();
  const existingByAbbr = new Map(
    existing.map((r) => [(r.get("Abbreviation") as string), r.id])
  );

  for (let i = 0; i < DEMO_STATES.length; i++) {
    const s = DEMO_STATES[i];
    if (existingByAbbr.has(s.abbreviation)) {
      map.set(i, existingByAbbr.get(s.abbreviation)!);
      console.log(`  State ${s.abbreviation} already exists`);
    } else {
      const record = await base("States").create({
        "State Name": s.name,
        Abbreviation: s.abbreviation,
      });
      map.set(i, record.id);
      console.log(`  Created state: ${s.name} (${s.abbreviation})`);
    }
  }
  return map;
}

async function seedDivisions(): Promise<RecordMap> {
  console.log("Seeding divisions...");
  const map: RecordMap = new Map();

  const existing = await base("Divisions").select().all();
  const existingByName = new Map(
    existing.map((r) => [(r.get("Division Name") as string), r.id])
  );

  for (let i = 0; i < DEMO_DIVISIONS.length; i++) {
    const d = DEMO_DIVISIONS[i];
    if (existingByName.has(d.name)) {
      map.set(i, existingByName.get(d.name)!);
      console.log(`  Division ${d.name} already exists`);
    } else {
      const record = await base("Divisions").create({
        "Division Name": d.name,
      });
      map.set(i, record.id);
      console.log(`  Created division: ${d.name}`);
    }
  }
  return map;
}

async function seedCategories(): Promise<RecordMap> {
  console.log("Seeding categories...");
  const map: RecordMap = new Map();

  const existing = await base("Categories").select().all();
  const existingByName = new Map(
    existing.map((r) => [(r.get("Category Name") as string), r.id])
  );

  for (let i = 0; i < DEMO_CATEGORIES.length; i++) {
    const c = DEMO_CATEGORIES[i];
    if (existingByName.has(c.name)) {
      map.set(i, existingByName.get(c.name)!);
      console.log(`  Category ${c.name} already exists`);
    } else {
      const record = await base("Categories").create({
        "Category Name": c.name,
      });
      map.set(i, record.id);
      console.log(`  Created category: ${c.name}`);
    }
  }
  return map;
}

async function seedSchools(stateMap: RecordMap): Promise<RecordMap> {
  console.log("Seeding schools...");
  const map: RecordMap = new Map();
  const stateAbbrToId = new Map<string, string>();
  for (let i = 0; i < DEMO_STATES.length; i++) {
    stateAbbrToId.set(DEMO_STATES[i].abbreviation, stateMap.get(i)!);
  }

  for (let i = 0; i < DEMO_SCHOOLS.length; i++) {
    const s = DEMO_SCHOOLS[i];
    const fields: Partial<Airtable.FieldSet> = {
      "Charter Name": s.name,
      City: s.city,
    };
    const stateId = stateAbbrToId.get(s.state);
    if (stateId) fields["State"] = [stateId];

    const record = await base("Charter").create(fields);
    map.set(i, record.id);
    console.log(`  Created school: ${s.name}`);
  }
  return map;
}

async function seedTeams(
  schoolMap: RecordMap,
  divisionMap: RecordMap
): Promise<RecordMap> {
  console.log("Seeding teams...");
  const map: RecordMap = new Map();
  const divNameToIdx = new Map<string, number>();
  DEMO_DIVISIONS.forEach((d, i) => divNameToIdx.set(d.name, i));

  for (let i = 0; i < DEMO_TEAMS.length; i++) {
    const t = DEMO_TEAMS[i];
    const fields: Partial<Airtable.FieldSet> = {
      "Team Name": t.name,
      "Advisor / Coach": t.coach,
      State: t.state,
    };

    const schoolId = schoolMap.get(t.school);
    if (schoolId) fields["Charter"] = [schoolId];

    const divIdx = divNameToIdx.get(t.division);
    if (divIdx !== undefined) {
      const divId = divisionMap.get(divIdx);
      if (divId) fields["Division"] = [divId];
    }

    const record = await base("Teams").create(fields);
    map.set(i, record.id);
    console.log(`  Created team: ${t.name}`);
  }
  return map;
}

async function seedEvents(
  stateMap: RecordMap,
  divisionMap: RecordMap,
  categoryMap: RecordMap,
  teamMap: RecordMap
): Promise<RecordMap> {
  console.log("Seeding events...");
  const map: RecordMap = new Map();
  const stateAbbrToId = new Map<string, string>();
  for (let i = 0; i < DEMO_STATES.length; i++) {
    stateAbbrToId.set(DEMO_STATES[i].abbreviation, stateMap.get(i)!);
  }
  const divNameToIdx = new Map<string, number>();
  DEMO_DIVISIONS.forEach((d, i) => divNameToIdx.set(d.name, i));

  for (let i = 0; i < DEMO_EVENTS.length; i++) {
    const e = DEMO_EVENTS[i];
    const fields: Partial<Airtable.FieldSet> = {
      "Event Name": e.name,
      "Event Date": e.date,
      Location: e.location,
    };

    const stateId = stateAbbrToId.get(e.state);
    if (stateId) fields["State"] = [stateId];

    const divIdx = divNameToIdx.get(e.division);
    if (divIdx !== undefined) {
      const divId = divisionMap.get(divIdx);
      if (divId) fields["Division"] = [divId];
    }

    // Link categories
    const catIds = e.categories
      .map((idx) => categoryMap.get(idx))
      .filter((id): id is string => !!id);
    if (catIds.length > 0) fields["Category"] = catIds;

    // Link teams
    const teamIds = e.teams
      .map((idx) => teamMap.get(idx))
      .filter((id): id is string => !!id);
    if (teamIds.length > 0) fields["Teams"] = teamIds;

    const record = await base("Events").create(fields);
    map.set(i, record.id);
    console.log(`  Created event: ${e.name} (${e.date})`);
  }
  return map;
}

async function seedTurnIns(
  eventMap: RecordMap,
  teamMap: RecordMap,
  categoryMap: RecordMap
) {
  console.log("Seeding sample turn-in scores for completed events...");

  // Only seed scores for past events (indices 2 and 3 are Feb/Mar 2026)
  const pastEventIndices = [2, 3];

  for (const eventIdx of pastEventIndices) {
    const event = DEMO_EVENTS[eventIdx];
    const eventId = eventMap.get(eventIdx);
    if (!eventId) continue;

    for (const teamIdx of event.teams) {
      const teamId = teamMap.get(teamIdx);
      if (!teamId) continue;

      for (const catIdx of event.categories) {
        const catId = categoryMap.get(catIdx);
        if (!catId) continue;

        // Generate 3 judge scores per team per category
        for (let judge = 1; judge <= 3; judge++) {
          const M = randomScore(60, 95);
          const E = randomScore(65, 98);
          const A = randomScore(60, 95);
          const T = randomScore(65, 98);
          const weighted = 0.1 * M + 0.5 * E + 0.2 * A + 0.2 * T;

          await base("Turn-Ins").create({
            Event: [eventId],
            Team: [teamId],
            Category: [catId],
            "Judge ID": `DEMO-Judge-${judge}`,
            MEAT_M: M,
            MEAT_E: E,
            MEAT_A: A,
            MEAT_T: T,
            "Weighted Score": Math.round(weighted * 100) / 100,
            "Submitted At": new Date(
              new Date(event.date).getTime() + judge * 3600000
            ).toISOString(),
          });
        }
      }

      console.log(
        `  Scored: ${DEMO_TEAMS[teamIdx].name} at ${event.name}`
      );
    }
  }
}

function randomScore(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("\n=== PITMSTR Demo Data Seeder ===\n");

  const stateMap = await seedStates();
  const divisionMap = await seedDivisions();
  const categoryMap = await seedCategories();
  const schoolMap = await seedSchools(stateMap);
  const teamMap = await seedTeams(schoolMap, divisionMap);
  const eventMap = await seedEvents(
    stateMap,
    divisionMap,
    categoryMap,
    teamMap
  );
  await seedTurnIns(eventMap, teamMap, categoryMap);

  console.log("\n=== Seeding Complete ===");
  console.log(`  States: ${DEMO_STATES.length}`);
  console.log(`  Divisions: ${DEMO_DIVISIONS.length}`);
  console.log(`  Categories: ${DEMO_CATEGORIES.length}`);
  console.log(`  Schools: ${DEMO_SCHOOLS.length}`);
  console.log(`  Teams: ${DEMO_TEAMS.length}`);
  console.log(`  Events: ${DEMO_EVENTS.length}`);
  console.log(`  Turn-In Scores: seeded for 2 past events\n`);
  console.log("All records prefixed with 'DEMO -' for easy identification.\n");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
