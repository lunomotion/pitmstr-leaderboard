/**
 * NHSBBQA® M.E.A.T. Scoring System
 *
 * Implements the official scoring engine per the NHSBBQA MEAT Scoring Developer Packet.
 *
 * Weights:
 *   M (Mis en Place) = 10%
 *   E (EAT / Taste)  = 50%
 *   A (Appearance)    = 20%
 *   T (Texture)       = 20%
 *
 * Rules:
 *   - 6 judges per category
 *   - Drop lowest judge score per component
 *   - Divide remaining 5 scores to get component average
 *   - Apply weights to get category score (max 100)
 *   - Event total = sum of all category scores (max = 100 × categories)
 *   - Deterministic tie-breaking index
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw scores from a single judge for one team in one category */
export interface JudgeScores {
  judgeId: string;
  /** Mis en Place score (0–100 scale before weighting) */
  M: number;
  /** EAT / Taste score */
  E: number;
  /** Appearance score */
  A: number;
  /** Texture & Tenderness score */
  T: number;
}

/** All judge scores for a team in a single category */
export interface CategoryJudgeScores {
  categoryName: string;
  judges: JudgeScores[];
}

/** Computed MEAT component averages for a category (after drop-lowest) */
export interface MEATComponents {
  M: number;
  E: number;
  A: number;
  T: number;
}

/** Computed score for a single category */
export interface CategoryResult {
  categoryName: string;
  /** Individual component averages after drop-lowest */
  components: MEATComponents;
  /** Weighted category score: 0.10*M + 0.50*E + 0.20*A + 0.20*T */
  score: number;
}

/** Full scoring result for one team at one event */
export interface TeamEventScore {
  teamId: string;
  teamName: string;
  schoolName: string;
  state: string;
  division: string;
  /** Per-category results */
  categories: CategoryResult[];
  /** Sum of all category scores */
  eventTotal: number;
  /** Maximum possible score (100 × number of categories) */
  maxPossible: number;
  /** Deterministic tie-breaking index */
  tieBreakIndex: number;
  /** Assigned rank (1-based) */
  rank: number;
}

// ---------------------------------------------------------------------------
// MEAT Weight Constants
// ---------------------------------------------------------------------------

export const MEAT_WEIGHTS = {
  M: 0.10,
  E: 0.50,
  A: 0.20,
  T: 0.20,
} as const;

/** Number of judges expected per category */
export const JUDGES_PER_CATEGORY = 6;

// ---------------------------------------------------------------------------
// Core Scoring Functions
// ---------------------------------------------------------------------------

/**
 * Drop the lowest score and average the remaining.
 * Formula: (SUM(scores) - MIN(score)) / (count - 1)
 *
 * If fewer than 2 scores provided, returns average of all scores.
 */
export function dropLowestAndAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return scores[0];

  const min = Math.min(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  return (sum - min) / (scores.length - 1);
}

/**
 * Compute MEAT component averages from judge scores, dropping the lowest per component.
 *
 * For each component (M, E, A, T):
 *   1. Collect that component's scores from all judges
 *   2. Drop the lowest score
 *   3. Average the remaining scores
 */
export function calculateMEATComponents(judges: JudgeScores[]): MEATComponents {
  const mScores = judges.map((j) => j.M);
  const eScores = judges.map((j) => j.E);
  const aScores = judges.map((j) => j.A);
  const tScores = judges.map((j) => j.T);

  return {
    M: dropLowestAndAverage(mScores),
    E: dropLowestAndAverage(eScores),
    A: dropLowestAndAverage(aScores),
    T: dropLowestAndAverage(tScores),
  };
}

/**
 * Calculate weighted category score from MEAT components.
 *
 * MEAT_CategoryScore = (0.10 × M) + (0.50 × E) + (0.20 × A) + (0.20 × T)
 *
 * Returns rounded to 3 decimal places (matching Airtable formula).
 */
export function calculateCategoryScore(components: MEATComponents): number {
  const raw =
    MEAT_WEIGHTS.M * components.M +
    MEAT_WEIGHTS.E * components.E +
    MEAT_WEIGHTS.A * components.A +
    MEAT_WEIGHTS.T * components.T;

  return Math.round(raw * 1000) / 1000;
}

/**
 * Calculate event total: sum of all category scores.
 *
 * MEAT_EventTotal = SUM(all category scores)
 * Max = 100 × number of categories
 */
export function calculateEventTotal(categoryScores: number[]): number {
  return categoryScores.reduce((a, b) => a + b, 0);
}

/**
 * Calculate deterministic tie-breaking index.
 *
 * Priority order:
 *   1. Highest MEAT_EventTotal
 *   2. Highest EatTotal (sum of E components across categories)
 *   3. Highest TextureTotal (sum of T components)
 *   4. Highest AppearanceTotal (sum of A components)
 *   5. Highest RibsScore (category score, 0 if not present)
 *   6. Highest ChickenScore (category score, 0 if not present)
 *
 * Formula (from developer packet):
 *   (ROUND(1000*EventTotal,0) * 10^15)
 * + (ROUND(EatTotal,0) * 10^12)
 * + (ROUND(TextureTotal,0) * 10^9)
 * + (ROUND(AppearanceTotal,0) * 10^6)
 * + (ROUND(1000*RibsScore,0) * 10^3)
 * + (ROUND(1000*ChickenScore,0))
 *
 * Returns as a BigInt-safe number (using string internally for precision).
 */
export function calculateTieBreakIndex(
  eventTotal: number,
  eatTotal: number,
  textureTotal: number,
  appearanceTotal: number,
  ribsScore: number,
  chickenScore: number
): number {
  // Use the same formula as the Airtable TieBreakIndex
  const p1 = Math.round(1000 * eventTotal) * Math.pow(10, 15);
  const p2 = Math.round(eatTotal) * Math.pow(10, 12);
  const p3 = Math.round(textureTotal) * Math.pow(10, 9);
  const p4 = Math.round(appearanceTotal) * Math.pow(10, 6);
  const p5 = Math.round(1000 * ribsScore) * Math.pow(10, 3);
  const p6 = Math.round(1000 * chickenScore);

  return p1 + p2 + p3 + p4 + p5 + p6;
}

// ---------------------------------------------------------------------------
// Full Scoring Pipeline
// ---------------------------------------------------------------------------

/**
 * Process a single category: judges → components → weighted score.
 */
export function scoreCategory(input: CategoryJudgeScores): CategoryResult {
  const components = calculateMEATComponents(input.judges);
  const score = calculateCategoryScore(components);

  return {
    categoryName: input.categoryName,
    components,
    score,
  };
}

/**
 * Helper to find a category score by name (case-insensitive partial match).
 */
function findCategoryScore(
  categories: CategoryResult[],
  ...searchTerms: string[]
): number {
  for (const term of searchTerms) {
    const lower = term.toLowerCase();
    const found = categories.find((c) =>
      c.categoryName.toLowerCase().includes(lower)
    );
    if (found) return found.score;
  }
  return 0;
}

/**
 * Full scoring pipeline for one team at one event.
 *
 * Input:  team info + array of category judge scores
 * Output: TeamEventScore with all calculations, ready for ranking
 */
export function scoreTeamEvent(input: {
  teamId: string;
  teamName: string;
  schoolName: string;
  state: string;
  division: string;
  categoryScores: CategoryJudgeScores[];
}): TeamEventScore {
  // Score each category
  const categories = input.categoryScores.map(scoreCategory);

  // Event total
  const eventTotal = calculateEventTotal(categories.map((c) => c.score));
  const maxPossible = categories.length * 100;

  // Aggregate component totals across all categories for tie-breaking
  const eatTotal = categories.reduce((sum, c) => sum + c.components.E, 0);
  const textureTotal = categories.reduce((sum, c) => sum + c.components.T, 0);
  const appearanceTotal = categories.reduce(
    (sum, c) => sum + c.components.A,
    0
  );

  // Find specific category scores for tie-breaking
  const ribsScore = findCategoryScore(categories, "ribs", "st. louis");
  const chickenScore = findCategoryScore(
    categories,
    "chicken",
    "drum",
    "lollipop"
  );

  const tieBreakIndex = calculateTieBreakIndex(
    eventTotal,
    eatTotal,
    textureTotal,
    appearanceTotal,
    ribsScore,
    chickenScore
  );

  return {
    teamId: input.teamId,
    teamName: input.teamName,
    schoolName: input.schoolName,
    state: input.state,
    division: input.division,
    categories,
    eventTotal,
    maxPossible,
    tieBreakIndex,
    rank: 0, // Assigned by rankTeams()
  };
}

/**
 * Rank an array of team event scores.
 *
 * Sorting priority:
 *   1. Highest MEAT_EventTotal (descending)
 *   2. Highest TieBreakIndex (descending) for ties
 *
 * Assigns 1-based ranks. Teams with identical eventTotal AND tieBreakIndex
 * receive the same rank.
 */
export function rankTeams(teams: TeamEventScore[]): TeamEventScore[] {
  // Sort by eventTotal desc, then tieBreakIndex desc
  const sorted = [...teams].sort((a, b) => {
    if (b.eventTotal !== a.eventTotal) return b.eventTotal - a.eventTotal;
    return b.tieBreakIndex - a.tieBreakIndex;
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      // If different score or different tie-break, increment rank
      if (
        curr.eventTotal !== prev.eventTotal ||
        curr.tieBreakIndex !== prev.tieBreakIndex
      ) {
        currentRank = i + 1;
      }
    }
    sorted[i].rank = currentRank;
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// Utility: Validate Judge Scores
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a set of judge scores for a category.
 * Returns an array of errors (empty = valid).
 */
export function validateJudgeScores(
  input: CategoryJudgeScores
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.categoryName || input.categoryName.trim() === "") {
    errors.push({
      field: "categoryName",
      message: "Category name is required",
    });
  }

  if (input.judges.length === 0) {
    errors.push({ field: "judges", message: "At least one judge is required" });
    return errors;
  }

  if (input.judges.length !== JUDGES_PER_CATEGORY) {
    errors.push({
      field: "judges",
      message: `Expected ${JUDGES_PER_CATEGORY} judges, got ${input.judges.length}`,
    });
  }

  for (let i = 0; i < input.judges.length; i++) {
    const judge = input.judges[i];
    const prefix = `judges[${i}]`;

    for (const component of ["M", "E", "A", "T"] as const) {
      const value = judge[component];
      if (typeof value !== "number" || isNaN(value)) {
        errors.push({
          field: `${prefix}.${component}`,
          message: `${component} must be a number`,
        });
      } else if (value < 0 || value > 100) {
        errors.push({
          field: `${prefix}.${component}`,
          message: `${component} must be between 0 and 100 (got ${value})`,
        });
      }
    }
  }

  return errors;
}
