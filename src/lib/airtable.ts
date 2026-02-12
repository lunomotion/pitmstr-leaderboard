import Airtable from "airtable";
import type {
  Event,
  Team,
  School,
  LeaderboardEntry,
  Category,
  Division,
  EventStatus,
  TeamMember,
} from "./types";

// Table names matching actual Airtable base
const TABLES = {
  EVENTS: "Events",
  TEAMS: "Teams",
  CHARTER: "Charter", // Schools
  STUDENTS: "Students", // Team Members
  TURN_INS: "Turn-Ins",
  REPORT_CARDS: "BBQ Report Cards",
  DIVISIONS: "Divisions",
  CATEGORIES: "Categories",
  STATES: "States",
  USERS: "Users",
  AUDIT_LOG: "Audit Log",
};

// Lazy initialization of Airtable base to avoid build-time errors
let _base: Airtable.Base | null = null;

function getBase(): Airtable.Base {
  if (_base) return _base;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey) {
    throw new Error(
      "AIRTABLE_API_KEY is not configured. Please add it to your .env.local file."
    );
  }

  if (!baseId) {
    throw new Error(
      "AIRTABLE_BASE_ID is not configured. Please add it to your .env.local file."
    );
  }

  _base = new Airtable({ apiKey }).base(baseId);
  return _base;
}

// Helper to get first linked record ID
function getFirstLinkedId(field: unknown): string | undefined {
  if (Array.isArray(field) && field.length > 0 && typeof field[0] === "string") {
    return field[0];
  }
  return undefined;
}

// Helper to get all linked record IDs
function getLinkedIds(field: unknown): string[] {
  if (Array.isArray(field)) {
    return field.filter((id): id is string => typeof id === "string");
  }
  return [];
}

// Helper to get image URL from Airtable attachment
function getImageUrl(field: unknown): string | undefined {
  if (Array.isArray(field) && field.length > 0) {
    const attachment = field[0] as { url?: string };
    return attachment?.url;
  }
  return undefined;
}

// Cache for lookups (divisions, categories, states)
const lookupCache: {
  divisions: Map<string, string>;
  categories: Map<string, string>;
  states: Map<string, { name: string; abbreviation: string }>;
} = {
  divisions: new Map(),
  categories: new Map(),
  states: new Map(),
};

// Load lookup tables into cache
async function loadDivisionsCache(): Promise<void> {
  if (lookupCache.divisions.size > 0) return;

  const records = await getBase()(TABLES.DIVISIONS).select().all();
  records.forEach((record) => {
    lookupCache.divisions.set(record.id, record.get("Division Name") as string);
  });
}

async function loadCategoriesCache(): Promise<void> {
  if (lookupCache.categories.size > 0) return;

  const records = await getBase()(TABLES.CATEGORIES).select().all();
  records.forEach((record) => {
    lookupCache.categories.set(record.id, record.get("Category Name") as string);
  });
}

async function loadStatesCache(): Promise<void> {
  if (lookupCache.states.size > 0) return;

  const records = await getBase()(TABLES.STATES).select().all();
  records.forEach((record) => {
    lookupCache.states.set(record.id, {
      name: record.get("State Name") as string,
      abbreviation: record.get("Abbreviation") as string,
    });
  });
}

// Get division name from linked ID
async function getDivisionName(linkedId: string | undefined): Promise<Division | undefined> {
  if (!linkedId) return undefined;
  await loadDivisionsCache();
  return lookupCache.divisions.get(linkedId) as Division | undefined;
}

// Get category names from linked IDs
async function getCategoryNames(linkedIds: string[]): Promise<Category[]> {
  if (linkedIds.length === 0) return [];
  await loadCategoriesCache();
  return linkedIds
    .map((id) => lookupCache.categories.get(id))
    .filter((name): name is Category => !!name);
}

// Get state info from linked ID
async function getStateInfo(linkedId: string | undefined): Promise<{ name: string; abbreviation: string } | undefined> {
  if (!linkedId) return undefined;
  await loadStatesCache();
  return lookupCache.states.get(linkedId);
}

// Fetch all events
export async function getEvents(options?: {
  status?: EventStatus;
  division?: Division;
  state?: string;
  limit?: number;
}): Promise<Event[]> {
  try {
    // Load lookup caches
    await Promise.all([loadDivisionsCache(), loadCategoriesCache(), loadStatesCache()]);

    const records = await getBase()(TABLES.EVENTS)
      .select({
        sort: [{ field: "Event Date", direction: "desc" }],
        maxRecords: options?.limit || 100,
      })
      .all();

    const events: Event[] = [];

    for (const record of records) {
      const divisionId = getFirstLinkedId(record.get("Division"));
      const division = await getDivisionName(divisionId);

      const stateId = getFirstLinkedId(record.get("State"));
      const stateInfo = await getStateInfo(stateId);

      const categoryIds = getLinkedIds(record.get("Category"));
      const categories = await getCategoryNames(categoryIds);

      // Apply filters
      if (options?.division && division !== options.division) continue;
      if (options?.state && stateInfo?.abbreviation !== options.state && stateInfo?.name !== options.state) continue;

      const event: Event = {
        id: record.id,
        createdTime: record._rawJson.createdTime,
        name: record.get("Event Name") as string,
        date: record.get("Event Date") as string,
        location: record.get("Location") as string,
        city: ((record.get("Location") as string) || "").split(",")[0]?.trim() || "",
        state: stateInfo?.abbreviation || stateInfo?.name || "",
        division: division || "HSBBQ",
        status: "upcoming" as EventStatus, // Default status - could be calculated from date
        description: record.get("Description") as string | undefined,
        hostSchool: undefined, // Not directly available
        registeredTeams: record.get("Team Count") as number | undefined,
        maxTeams: undefined,
        categories: categories.length > 0 ? categories : ["Brisket", "Pork", "Chicken"],
        imageUrl: getImageUrl(record.get("Event Photo")),
      };

      // Determine status from date
      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate > now) {
        event.status = "upcoming";
      } else if (eventDate.toDateString() === now.toDateString()) {
        event.status = "live";
      } else {
        event.status = "completed";
      }

      // Filter by status if specified
      if (options?.status && event.status !== options.status) continue;

      events.push(event);
    }

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

// Fetch single event by ID
export async function getEvent(eventId: string): Promise<Event | null> {
  try {
    await Promise.all([loadDivisionsCache(), loadCategoriesCache(), loadStatesCache()]);

    const record = await getBase()(TABLES.EVENTS).find(eventId);

    const divisionId = getFirstLinkedId(record.get("Division"));
    const division = await getDivisionName(divisionId);

    const stateId = getFirstLinkedId(record.get("State"));
    const stateInfo = await getStateInfo(stateId);

    const categoryIds = getLinkedIds(record.get("Category"));
    const categories = await getCategoryNames(categoryIds);

    const event: Event = {
      id: record.id,
      createdTime: record._rawJson.createdTime,
      name: record.get("Event Name") as string,
      date: record.get("Event Date") as string,
      location: record.get("Location") as string,
      city: ((record.get("Location") as string) || "").split(",")[0]?.trim() || "",
      state: stateInfo?.abbreviation || stateInfo?.name || "",
      division: division || "HSBBQ",
      status: "upcoming" as EventStatus,
      description: record.get("Description") as string | undefined,
      registeredTeams: record.get("Team Count") as number | undefined,
      categories: categories.length > 0 ? categories : ["Brisket", "Pork", "Chicken"],
      imageUrl: getImageUrl(record.get("Event Photo")),
    };

    // Determine status from date
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate > now) {
      event.status = "upcoming";
    } else if (eventDate.toDateString() === now.toDateString()) {
      event.status = "live";
    } else {
      event.status = "completed";
    }

    return event;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

// Fetch leaderboard for an event
// Gets teams from the Event's linked Teams field, scores from BBQ Report Cards
export async function getEventLeaderboard(
  eventId: string,
  category: Category = "Overall"
): Promise<LeaderboardEntry[]> {
  try {
    await Promise.all([loadDivisionsCache(), loadCategoriesCache(), loadStatesCache()]);

    // Get the event record to find linked teams
    const eventRecord = await getBase()(TABLES.EVENTS).find(eventId);
    const teamIds = getLinkedIds(eventRecord.get("Teams"));

    if (teamIds.length === 0) return [];

    // Fetch all Report Cards and filter for this event
    const allReportCards = await getBase()(TABLES.REPORT_CARDS)
      .select({ maxRecords: 1000 })
      .all();

    const eventReportCards = allReportCards.filter((record) => {
      const eventIds = getLinkedIds(record.get("Event"));
      return eventIds.includes(eventId);
    });

    // Build score data per team, grouped by category
    const teamScores = new Map<string, { total: number; count: number; categoryTotals: Record<string, { total: number; count: number }> }>();

    for (const rc of eventReportCards) {
      const rcTeamId = getFirstLinkedId(rc.get("Team"));
      if (!rcTeamId || !teamIds.includes(rcTeamId)) continue;

      const totalScore = (rc.get("Total Score") as number) || 0;
      const categoryIds = getLinkedIds(rc.get("Category"));
      const categoryName = categoryIds.length > 0
        ? lookupCache.categories.get(categoryIds[0]) || "Unknown"
        : "Unknown";

      // If filtering by category, skip report cards for other categories
      if (category !== "Overall" && categoryName !== category) continue;

      if (!teamScores.has(rcTeamId)) {
        teamScores.set(rcTeamId, { total: 0, count: 0, categoryTotals: {} });
      }

      const data = teamScores.get(rcTeamId)!;
      data.total += totalScore;
      data.count += 1;

      // Track per-category scores
      if (!data.categoryTotals[categoryName]) {
        data.categoryTotals[categoryName] = { total: 0, count: 0 };
      }
      data.categoryTotals[categoryName].total += totalScore;
      data.categoryTotals[categoryName].count += 1;
    }

    // Fetch team details and build entries
    const entries: LeaderboardEntry[] = [];

    for (const teamId of teamIds) {
      try {
        const team = await getTeam(teamId);
        if (!team) continue;

        const scoreData = teamScores.get(teamId);
        const score = scoreData ? scoreData.total / scoreData.count : 0;

        entries.push({
          rank: 0, // Will be set after sorting
          teamId: team.id,
          teamName: team.name,
          schoolName: team.schoolName || "",
          schoolId: team.schoolId,
          state: team.state || "",
          division: team.division,
          score: Math.round(score * 100) / 100,
          categoryScores: scoreData
            ? Object.fromEntries(
                Object.entries(scoreData.categoryTotals).map(([cat, d]) => [
                  cat,
                  { score: Math.round((d.total / d.count) * 100) / 100, rank: 0 },
                ])
              )
            : {},
        });
      } catch (err) {
        console.error(`Error fetching team ${teamId}:`, err);
      }
    }

    // Sort by score descending, then assign ranks
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
}

// Fetch team details
export async function getTeam(teamId: string): Promise<Team | null> {
  try {
    await Promise.all([loadDivisionsCache(), loadStatesCache()]);

    const record = await getBase()(TABLES.TEAMS).find(teamId);

    const divisionId = getFirstLinkedId(record.get("Division"));
    const division = await getDivisionName(divisionId);

    // Get school info from Charter link
    const charterId = getFirstLinkedId(record.get("Charter"));
    let schoolName: string | undefined;
    let schoolId: string = "";

    if (charterId) {
      try {
        const charter = await getBase()(TABLES.CHARTER).find(charterId);
        schoolName = charter.get("Charter Name") as string;
        schoolId = charter.id;
      } catch (err) {
        console.error("Error fetching charter:", err);
      }
    }

    return {
      id: record.id,
      createdTime: record._rawJson.createdTime,
      name: record.get("Team Name") as string,
      schoolId: schoolId,
      schoolName: schoolName,
      division: division || "HSBBQ",
      coach: record.get("Advisor / Coach") as string | undefined,
      state: record.get("State") as string | undefined,
    };
  } catch (error) {
    console.error("Error fetching team:", error);
    return null;
  }
}

// Fetch school (Charter) details
export async function getSchool(schoolId: string): Promise<School | null> {
  try {
    await loadStatesCache();

    const record = await getBase()(TABLES.CHARTER).find(schoolId);

    const stateId = getFirstLinkedId(record.get("State"));
    const stateInfo = await getStateInfo(stateId);

    return {
      id: record.id,
      createdTime: record._rawJson.createdTime,
      name: record.get("Charter Name") as string,
      city: record.get("City") as string,
      state: stateInfo?.abbreviation || stateInfo?.name || "",
      district: record.get("County") as string | undefined,
      logoUrl: getImageUrl(record.get("Charter Photo")),
      teams: getLinkedIds(record.get("Teams")),
    };
  } catch (error) {
    console.error("Error fetching school:", error);
    return null;
  }
}

// Search teams (pass empty string or space to get all)
export async function searchTeams(query: string): Promise<Team[]> {
  try {
    await Promise.all([loadDivisionsCache(), loadStatesCache()]);

    const lowerQuery = query.trim().toLowerCase();
    const returnAll = lowerQuery === "" || lowerQuery === " ";

    const records = await getBase()(TABLES.TEAMS)
      .select({
        maxRecords: returnAll ? 200 : 50,
      })
      .all();

    const teams: Team[] = [];

    for (const record of records) {
      const teamName = (record.get("Team Name") as string) || "";
      const state = (record.get("State") as string) || "";

      // Simple text search (or return all if no query)
      if (
        returnAll ||
        teamName.toLowerCase().includes(lowerQuery) ||
        state.toLowerCase().includes(lowerQuery)
      ) {
        const divisionId = getFirstLinkedId(record.get("Division"));
        const division = await getDivisionName(divisionId);

        // Get school info
        const charterId = getFirstLinkedId(record.get("Charter"));
        let schoolName: string | undefined;
        let schoolId: string = "";

        if (charterId) {
          try {
            const charter = await getBase()(TABLES.CHARTER).find(charterId);
            schoolName = charter.get("Charter Name") as string;
            schoolId = charter.id;
          } catch (err) {
            // Ignore error
          }
        }

        teams.push({
          id: record.id,
          createdTime: record._rawJson.createdTime,
          name: teamName,
          schoolId: schoolId,
          schoolName: schoolName,
          division: division || "HSBBQ",
          coach: record.get("Advisor / Coach") as string | undefined,
          state: state,
        });

        if (!returnAll && teams.length >= 20) break;
      }
    }

    return teams;
  } catch (error) {
    console.error("Error searching teams:", error);
    throw error;
  }
}

// Get team members (Students)
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const records = await getBase()(TABLES.STUDENTS)
      .select({
        filterByFormula: `FIND('${teamId}', ARRAYJOIN({Team}))`,
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      createdTime: record._rawJson.createdTime,
      name: record.get("Member Name") as string,
      teamId: teamId,
      role: record.get("Role") as string | undefined,
      photoUrl: getImageUrl(record.get("Photo")),
      email: record.get("Email") as string | undefined,
    }));
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
}

// Get all available categories
export async function getCategories(): Promise<Category[]> {
  try {
    await loadCategoriesCache();
    return Array.from(lookupCache.categories.values()) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get all divisions
export async function getDivisions(): Promise<Division[]> {
  try {
    await loadDivisionsCache();
    return Array.from(lookupCache.divisions.values()) as Division[];
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }
}

// Get all states
export async function getStates(): Promise<{ name: string; abbreviation: string }[]> {
  try {
    await loadStatesCache();
    return Array.from(lookupCache.states.values());
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
}

// ============================================================
// USER MANAGEMENT (synced with Clerk)
// ============================================================

export interface AirtableUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  schoolId: string | null;
  stateId: string | null;
  status: string;
  createdAt: string | null;
  lastLogin: string | null;
}

// Create a user record when they sign up via Clerk
export async function createUser(
  clerkId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<AirtableUser> {
  try {
    const record = await getBase()(TABLES.USERS).create({
      "Clerk ID": clerkId,
      Email: email,
      "First Name": firstName,
      "Last Name": lastName,
      Status: "pending",
      "Created At": new Date().toISOString(),
    });

    return {
      id: record.id,
      clerkId: record.get("Clerk ID") as string,
      email: record.get("Email") as string,
      firstName: record.get("First Name") as string,
      lastName: record.get("Last Name") as string,
      role: null,
      schoolId: null,
      stateId: null,
      status: "pending",
      createdAt: record.get("Created At") as string,
      lastLogin: null,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Find a user by their Clerk ID
export async function getUserByClerkId(
  clerkId: string
): Promise<AirtableUser | null> {
  try {
    const records = await getBase()(TABLES.USERS)
      .select({
        filterByFormula: `{Clerk ID} = '${clerkId}'`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) return null;

    const record = records[0];
    return {
      id: record.id,
      clerkId: record.get("Clerk ID") as string,
      email: record.get("Email") as string,
      firstName: record.get("First Name") as string,
      lastName: record.get("Last Name") as string,
      role: (record.get("Role") as string) || null,
      schoolId: getFirstLinkedId(record.get("School")) || null,
      stateId: getFirstLinkedId(record.get("State")) || null,
      status: (record.get("Status") as string) || "pending",
      createdAt: record.get("Created At") as string | null,
      lastLogin: record.get("Last Login") as string | null,
    };
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

// Update a user's info (called from webhook on user.updated)
export async function updateUser(
  clerkId: string,
  data: { email?: string; firstName?: string; lastName?: string; lastLogin?: string }
): Promise<void> {
  try {
    const user = await getUserByClerkId(clerkId);
    if (!user) return;

    const fields: Partial<Airtable.FieldSet> = {};
    if (data.email) fields["Email"] = data.email;
    if (data.firstName) fields["First Name"] = data.firstName;
    if (data.lastName) fields["Last Name"] = data.lastName;
    if (data.lastLogin) fields["Last Login"] = data.lastLogin;

    await getBase()(TABLES.USERS).update(user.id, fields);
  } catch (error) {
    console.error("Error updating user:", error);
  }
}

// Update a user's role and status (called from admin dashboard)
export async function updateUserRole(
  clerkId: string,
  role: string,
  options?: { schoolId?: string; stateId?: string }
): Promise<void> {
  try {
    const user = await getUserByClerkId(clerkId);
    if (!user) return;

    const fields: Partial<Airtable.FieldSet> = {
      Role: role,
      Status: "active",
    };

    if (options?.schoolId) fields["School"] = [options.schoolId];
    if (options?.stateId) fields["State"] = [options.stateId];

    await getBase()(TABLES.USERS).update(user.id, fields);
  } catch (error) {
    console.error("Error updating user role:", error);
  }
}

// Delete/suspend user (called from webhook on user.deleted)
export async function suspendUser(clerkId: string): Promise<void> {
  try {
    const user = await getUserByClerkId(clerkId);
    if (!user) return;

    await getBase()(TABLES.USERS).update(user.id, { Status: "suspended" });
  } catch (error) {
    console.error("Error suspending user:", error);
  }
}

// ============================================================
// AUDIT LOGGING
// ============================================================

export async function logAuditEvent(
  userId: string,
  action: string,
  targetType: "event" | "team" | "user" | "school",
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    // Find the user's Airtable record to link
    const user = await getUserByClerkId(userId);

    const fields: Partial<Airtable.FieldSet> = {
      Timestamp: new Date().toISOString(),
      Action: action,
      "Target Type": targetType,
      "Target ID": targetId,
    };

    if (user) fields["User"] = [user.id];
    if (details) fields["Details"] = JSON.stringify(details, null, 2);
    if (ipAddress) fields["IP Address"] = ipAddress;

    await getBase()(TABLES.AUDIT_LOG).create(fields);
  } catch (error) {
    // Don't throw — audit logging should never break the main operation
    console.error("Error logging audit event:", error);
  }
}
