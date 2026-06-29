# Scoring Engine

The MEAT scoring engine lives in [`src/lib/scoring.ts`](https://github.com/). It is a set of pure, side-effect-free functions that turn raw judge scores into ranked team results. It does not touch Airtable, Clerk, or the network: it takes plain objects in and returns plain objects out. The HTTP layer that calls it is documented in [API: scoring](../api/scoring.md).

!!! info "MEAT stands for"
    **M**is en Place, **E**AT (taste), **A**ppearance, **T**exture & Tenderness. These are the four components every judge scores for every team in every food category.

## At a glance

| Concept | Value | Source |
|---|---|---|
| Components | M, E, A, T | `JudgeScores` interface |
| Component weights | M 10%, E 50%, A 20%, T 20% | `MEAT_WEIGHTS` |
| Judges per category | 6 | `JUDGES_PER_CATEGORY` |
| Drop rule | Drop the single lowest value, per component | `dropLowestAndAverage` |
| Category score range | 0 to 100 | `calculateCategoryScore` |
| Event total range | 0 to `100 x categories` | `calculateEventTotal` |
| Category rounding | 3 decimal places | `calculateCategoryScore` |

## Inputs

The engine works on the 0 to 100 component scale. Every judge submits four numbers, each between 0 and 100, for one team in one category:

```ts
export interface JudgeScores {
  judgeId: string;
  M: number; // Mis en Place score (0-100 before weighting)
  E: number; // EAT / Taste score
  A: number; // Appearance score
  T: number; // Texture & Tenderness score
}
```

Six of these make up one category's worth of scoring:

```ts
export interface CategoryJudgeScores {
  categoryName: string;
  judges: JudgeScores[];
}
```

!!! warning "Two different MEAT scales exist in this codebase"
    The engine in `scoring.ts` expects each component on a **0 to 100** scale and applies fractional weights (`M 0.10, E 0.50, A 0.20, T 0.20`). The maximum points each component can contribute to a category are therefore **M 10, E 50, A 20, T 20**.

    The judge submission endpoint (`POST /api/scoring/submit`) and the QR scoring form use a **different raw-point scale**: **M 0-10, E 0-55, A 0-15, T 0-20**, summed directly to a `Total Score` out of 100 with no weighting and no drop-lowest.

    These two scales do **not** agree on E and A (engine treats EAT as 50 and Appearance as 20; the submission path treats EAT as 55 and Appearance as 15). They are two separate representations of "the MEAT system" that are not wired together. See [Mismatch between the engine and the submission path](#mismatch-between-the-engine-and-the-submission-path) below before relying on either for an official ranking.

## The algorithm, step by step

### Step 1: Drop the lowest score per component

For each of the four components, the engine collects all six judges' values for that component, drops the single lowest value, and averages the remaining five.

```ts
export function dropLowestAndAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  if (scores.length === 1) return scores[0];

  const min = Math.min(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  return (sum - min) / (scores.length - 1);
}
```

The drop is **per component, independent of the others**. A judge who gives the lowest Taste score is not necessarily the judge whose Appearance score gets dropped. There is no concept of dropping a whole judge.

```ts
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
```

!!! note "Edge cases in the drop rule"
    - **0 scores:** returns `0`.
    - **1 score:** returns that score unchanged (nothing to drop).
    - **2+ scores:** drops exactly one minimum, divides by `count - 1`. With the expected 6 judges this divides by 5.
    - If two or more judges tie for the lowest value, only **one** is removed (`Math.min` finds one value; the subtraction removes a single instance of it). The other tied values remain in the average.

### Step 2: Apply the weights to get a category score

```ts
export const MEAT_WEIGHTS = {
  M: 0.10,
  E: 0.50,
  A: 0.20,
  T: 0.20,
} as const;
```

```ts
export function calculateCategoryScore(components: MEATComponents): number {
  const raw =
    MEAT_WEIGHTS.M * components.M +
    MEAT_WEIGHTS.E * components.E +
    MEAT_WEIGHTS.A * components.A +
    MEAT_WEIGHTS.T * components.T;

  return Math.round(raw * 1000) / 1000;
}
```

The result is rounded to **3 decimal places** to match the Airtable formula. Because each weighted component maxes out at 10 + 50 + 20 + 20, a category score lands between 0 and 100.

### Step 3: Sum categories into an event total

```ts
export function calculateEventTotal(categoryScores: number[]): number {
  return categoryScores.reduce((a, b) => a + b, 0);
}
```

The event total is a plain sum of the category scores. The maximum is `categories.length * 100` and is reported as `maxPossible`.

### Step 4: Compute the deterministic tie-break index

When two teams tie on event total, the engine produces a single packed number that encodes a priority order of fallback criteria:

```ts
export function calculateTieBreakIndex(
  eventTotal: number,
  eatTotal: number,
  textureTotal: number,
  appearanceTotal: number,
  ribsScore: number,
  chickenScore: number
): number {
  const p1 = Math.round(1000 * eventTotal) * Math.pow(10, 15);
  const p2 = Math.round(eatTotal) * Math.pow(10, 12);
  const p3 = Math.round(textureTotal) * Math.pow(10, 9);
  const p4 = Math.round(appearanceTotal) * Math.pow(10, 6);
  const p5 = Math.round(1000 * ribsScore) * Math.pow(10, 3);
  const p6 = Math.round(1000 * chickenScore);

  return p1 + p2 + p3 + p4 + p5 + p6;
}
```

The intended priority order (highest wins at each level) is:

1. Event total
2. EAT total (sum of E components across all categories)
3. Texture total (sum of T components)
4. Appearance total (sum of A components)
5. Ribs category score
6. Chicken category score

`eatTotal`, `textureTotal`, and `appearanceTotal` are summed across every category in `scoreTeamEvent`. The ribs and chicken scores are located by name match (see [Category name matching](#category-name-matching)).

!!! danger "Known precision limitation in the tie-break index"
    This function multiplies by `10^15` using ordinary JavaScript `number` (IEEE-754 double) arithmetic. A double can only hold about 15 to 16 significant decimal digits exactly (`Number.MAX_SAFE_INTEGER` is roughly `9.007 x 10^15`).

    For any realistic event total, `p1` alone is on the order of `10^19` to `10^20`, far past the safe-integer range. The lower-priority terms (`p5` ribs and `p6` chicken at magnitudes `10^3` to `10^6`, and to a lesser extent `p4`, `p3`, `p2`) fall below the precision available at that magnitude and are effectively lost to floating-point rounding.

    **Net effect:** the tie-break index reliably encodes the event total and the top digits of EAT total, but the finer fallback criteria (texture, appearance, ribs, chicken) are not dependable in the current implementation. The function's own doc comment claims it is "BigInt-safe ... using string internally for precision," but the code does **not** use `BigInt` or strings. Treat ties below the event-total level as unresolved and verify against the official Airtable `TieBreakIndex` formula before publishing standings.

### Step 5: Rank the teams

```ts
export function rankTeams(teams: TeamEventScore[]): TeamEventScore[] {
  const sorted = [...teams].sort((a, b) => {
    if (b.eventTotal !== a.eventTotal) return b.eventTotal - a.eventTotal;
    return b.tieBreakIndex - a.tieBreakIndex;
  });

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
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
```

Teams are sorted by event total descending, then by tie-break index descending. Ranks are **1-based with standard competition ranking** (the "1224" style): teams with an identical `eventTotal` **and** identical `tieBreakIndex` share a rank, and the next distinct team takes the rank equal to its array position plus one. For example, three teams scoring 95, 95, 90 receive ranks 1, 1, 3.

!!! note
    `rankTeams` mutates the `rank` field of the objects it sorts and returns the same objects in a new array. The input array order is not changed because the sort runs on a shallow copy (`[...teams]`).

## The full pipeline

`scoreTeamEvent` chains everything for one team at one event:

```ts
export function scoreTeamEvent(input: {
  teamId: string; teamName: string; schoolName: string;
  state: string; division: string;
  categoryScores: CategoryJudgeScores[];
}): TeamEventScore {
  const categories = input.categoryScores.map(scoreCategory);
  const eventTotal = calculateEventTotal(categories.map((c) => c.score));
  const maxPossible = categories.length * 100;

  const eatTotal = categories.reduce((sum, c) => sum + c.components.E, 0);
  const textureTotal = categories.reduce((sum, c) => sum + c.components.T, 0);
  const appearanceTotal = categories.reduce((sum, c) => sum + c.components.A, 0);

  const ribsScore = findCategoryScore(categories, "ribs", "st. louis");
  const chickenScore = findCategoryScore(categories, "chicken", "drum", "lollipop");

  const tieBreakIndex = calculateTieBreakIndex(
    eventTotal, eatTotal, textureTotal, appearanceTotal, ribsScore, chickenScore
  );

  return { /* ...team fields..., */ categories, eventTotal, maxPossible, tieBreakIndex, rank: 0 };
}
```

`rank` starts at `0` and is only assigned later by `rankTeams`. A `TeamEventScore` you have not passed through `rankTeams` will have `rank: 0`.

### Category name matching

The ribs and chicken tie-break inputs are found by a case-insensitive substring search:

```ts
function findCategoryScore(categories: CategoryResult[], ...searchTerms: string[]): number {
  for (const term of searchTerms) {
    const lower = term.toLowerCase();
    const found = categories.find((c) => c.categoryName.toLowerCase().includes(lower));
    if (found) return found.score;
  }
  return 0;
}
```

- Ribs is matched against `"ribs"` then `"st. louis"`.
- Chicken is matched against `"chicken"`, `"drum"`, then `"lollipop"`.
- If no category name contains any of the search terms, the function returns `0`, so a team with no ribs category contributes `0` at the ribs tie-break level.

!!! warning "Verify"
    Category matching is substring-based and order-sensitive. A category literally named "Chicken Lollipops" matches on the first term `"chicken"`. A category named only "Lollipops" still matches on the third term. Confirm the live category names in Airtable match these search terms, or two distinct categories could collide or be missed.

## Validation

`validateJudgeScores` checks one category's judge set and returns an array of errors (empty means valid):

```ts
export function validateJudgeScores(input: CategoryJudgeScores): ValidationError[] {
  // categoryName required
  // judges.length === 0 -> error, return early
  // judges.length !== JUDGES_PER_CATEGORY (6) -> error
  // each judge: M, E, A, T must be a number and between 0 and 100
}
```

Rules enforced:

- `categoryName` must be present and non-empty.
- At least one judge is required (empty judge list returns immediately).
- The judge count must be exactly `6`; any other count is an error (but note this is a soft signal: a count error is reported, yet `scoreTeamEvent` will still compute a result from however many judges are present).
- Every component on every judge must be a finite number in the inclusive range `0` to `100`.

!!! warning "Validation scale vs submission scale"
    `validateJudgeScores` enforces the **0 to 100** engine scale. The `POST /api/scoring/submit` endpoint enforces a **different** per-component range (M 0-10, E 0-55, A 0-15, T 0-20). They are not the same validator and not the same numbers.

## Worked example

One team, one category ("Ribs"), six judges, scores on the engine's 0 to 100 scale.

| Judge | M | E | A | T |
|---|---|---|---|---|
| 1 | 80 | 90 | 85 | 88 |
| 2 | 78 | 92 | 80 | 90 |
| 3 | 82 | 88 | 90 | 85 |
| 4 | 60 | 70 | 75 | 70 |
| 5 | 85 | 95 | 88 | 92 |
| 6 | 79 | 91 | 86 | 89 |

**Step 1, drop lowest per component and average the other five:**

- M: drop 60, `(80+78+82+85+79) / 5 = 404 / 5 = 80.8`
- E: drop 70, `(90+92+88+95+91) / 5 = 456 / 5 = 91.2`
- A: drop 75, `(85+80+90+88+86) / 5 = 429 / 5 = 85.8`
- T: drop 70, `(88+90+85+92+89) / 5 = 444 / 5 = 88.8`

**Step 2, apply weights:**

```text
score = 0.10*80.8 + 0.50*91.2 + 0.20*85.8 + 0.20*88.8
      = 8.08     + 45.6      + 17.16     + 17.76
      = 88.6
```

The Ribs category score is **88.6**.

**Step 3, event total** (single category here): `88.6`, with `maxPossible = 1 * 100 = 100`.

**Step 4, tie-break aggregates** for this team: `eatTotal = 91.2`, `textureTotal = 88.8`, `appearanceTotal = 85.8`, `ribsScore = 88.6`, `chickenScore = 0` (no chicken category present).

## Mismatch between the engine and the submission path

This is the single most important thing to understand before trusting any number on a leaderboard.

- `POST /api/scoring/submit` writes **one row per judge** to the Airtable **BBQ Report Cards** table, storing the raw component points (M 0-10, E 0-55, A 0-15, T 0-20) and letting Airtable sum a `Total Score`. It performs **no** drop-lowest and **no** weighting.
- `POST /api/scoring/calculate` runs the `scoring.ts` engine described on this page, but it expects a **fully assembled JSON payload** of teams, categories, and 6-judge arrays on the 0 to 100 scale. It does **not** read the BBQ Report Cards that `submit` wrote.

!!! danger "There is no code path that feeds submitted report cards into the engine"
    Nothing in the reviewed code reads the per-judge BBQ Report Cards, reshapes them into `CategoryJudgeScores`, and calls `scoreTeamEvent` / `rankTeams`. The aggregation from raw judge submissions to an official, drop-lowest, weighted, tie-broken ranking is currently either done elsewhere (Airtable formulas, a manual step, or the Google Sheets mirror) or not done at all in this repo. A developer taking over should confirm where final standings are actually computed before changing either side.

## Penalties

The engine has **no penalty logic**. None of the functions in `scoring.ts` accept, subtract, or even mention penalties.

A `Total Penalty Points` field does exist in the Airtable **BBQ Report Cards** table and is surfaced read-only by `GET /api/admin/scorecards` as `totalPenalty`, but it is never written by the scoring endpoints and never applied to any computed score in code.

!!! warning "Verify"
    If penalties are meant to reduce a team's score, that subtraction is happening in Airtable or by hand, not in `scoring.ts`. Confirm the intended behavior with the client (Mike) and the `NHSBBQA_MEAT_Scoring_Developer_Packet.docx` reference before wiring penalties into the engine.

## Type reference

| Type | Purpose |
|---|---|
| `JudgeScores` | One judge's M/E/A/T for one team in one category |
| `CategoryJudgeScores` | A category name plus its array of `JudgeScores` |
| `MEATComponents` | The four post-drop component averages |
| `CategoryResult` | A category's components plus its weighted `score` |
| `TeamEventScore` | A team's full result: categories, `eventTotal`, `maxPossible`, `tieBreakIndex`, `rank` |
| `ValidationError` | `{ field, message }` returned by `validateJudgeScores` |

## Related pages

- [API: scoring](../api/scoring.md) -- the HTTP endpoints that call this engine and write to Airtable.
- [Scoring & Judging](../features/scoring-judging.md) -- the end-to-end judging flow an admin runs at an event.
