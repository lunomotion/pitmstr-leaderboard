# Scoring & Judging

This page walks an admin through a competition from the moment a team arrives to the moment scores are entered and reviewed. It describes what the platform actually does today, including the gaps a developer should know about. For the math, see [Scoring Engine](../subsystems/scoring-engine.md); for the raw endpoints, see [API: scoring](../api/scoring.md).

## The MEAT system in one paragraph

Every team is judged on four components for each food category: **M**is en Place (station cleanliness and setup), **E**AT (taste), **A**ppearance, and **T**exture & Tenderness. On the judge form these are scored as raw points that add to 100: **M out of 10, E out of 55, A out of 15, T out of 20**. Six judges score each category. The official aggregation drops each judge panel's lowest value per component, weights the components, and sums categories into an event total, with a deterministic tie-break order behind it.

!!! warning "One number, two scales"
    The judge form and the saved scorecards use the raw-point scale (10 / 55 / 15 / 20). The drop-lowest-and-weight engine in `scoring.ts` uses a 0-to-100 component scale with weights (10% / 50% / 20% / 20%). They are two representations of MEAT that are **not** automatically connected in code. Before publishing official standings, confirm where the raw scorecards are aggregated into a ranking (Airtable formula, manual step, or the Google Sheets mirror). Details: [engine mismatch](../subsystems/scoring-engine.md#mismatch-between-the-engine-and-the-submission-path).

## The flow at a glance

```text
1. Team arrives  ->  scans CHECK-IN QR    ->  Turn-Ins row (SYSTEM-CHECKIN)
2. Team turns in ->  judges scan TURN-IN QR per category
3. Each judge    ->  enters M/E/A/T -> reviews -> confirms -> BBQ Report Cards row
4. Admin         ->  reviews scorecards in the admin console
5. Aggregation   ->  drop-lowest, weight, rank  (see "Finalize" caveat)
```

## Step 1: Check-in (QR)

When a team arrives, someone scans the team's check-in QR code. That opens:

```text
/scan/checkin/[eventId]/[teamId]
```

The page (`src/app/scan/checkin/.../page.tsx`) immediately POSTs `{ eventId, teamId }` to `POST /api/scoring/checkin`, with no further input. The screen shows one of three states: a spinner ("Checking In..."), a green success card with the team name, event name, and local timestamp, or a red error.

Behind the scenes the endpoint:

- Loads the team and event to confirm they exist and to fetch display names (a bad id returns `404`).
- Writes a row to the Airtable **Turn-Ins** table whose `Notes` start with `SYSTEM-CHECKIN |` and whose `Submitted At` is the check-in time.

!!! note "Check-ins live in Turn-Ins, not their own table"
    A check-in is a tagged Turn-Ins row. When you build attendance counts or turn-in counts, decide explicitly whether to include or exclude rows whose `Notes` begin with `SYSTEM-CHECKIN`.

## Step 2: Turn-in and open the scorecard (QR)

At turn-in time, each judge scans the QR code for that team and category. The URL carries all three identifiers plus the category:

```text
/scan/turnin/[eventId]/[teamId]/[category]
```

The `[category]` slug is humanized for display: hyphens become spaces and each word is capitalized, so `st-louis-ribs` shows as "St Louis Ribs" (`src/app/scan/turnin/.../page.tsx`). That same display string is later sent to the API and used to look up the category in Airtable, so the slug must correspond to a real `Category Name`.

The form is a focused three-step wizard so a judge cannot fat-finger a final submission.

### Step 2a: Enter scores

The judge enters their **name** (free text, used as the judge identifier) and the four component scores. Each input is range-bound on the form:

| Component | Label on form | Max | What it covers (form helper text) |
|---|---|---|---|
| M | Mis En Place | 10 | Cleanliness, organization, setup, station readiness |
| E | Taste (EAT) | 55 | Flavor, seasoning, smoke profile, overall taste |
| A | Appearance | 15 | Visual presentation, color, garnish, appeal |
| T | Texture & Tenderness | 20 | Bite, moisture, tenderness, consistency |

A running total out of 100 updates live. Inputs accept up to one decimal place and step by 0.5. The "Review Scores" button validates that a judge name is present and every component is filled and within range before advancing.

There is also an optional **Notes** field.

!!! warning "Notes are not saved"
    The form collects notes, but the BBQ Report Cards table has no Notes field, so the API drops them. If judge notes need to persist, a Notes field must be added to the table and to `POST /api/scoring/submit`.

### Step 2b: Review

Step 2 of 3 shows a read-only summary: the judge name, each component score over its max, and the total over 100. The judge can go back and edit or proceed.

### Step 2c: Confirm and submit

Tapping "Confirm & Submit" opens a final "Are you sure?" modal that restates the total and warns the action cannot be undone. Confirming POSTs to `POST /api/scoring/submit`, which:

- Re-validates id shapes and score ranges server-side (rejecting malformed input and guarding against Airtable formula injection).
- Looks up the **Category** and **Judge** records by name (best-effort).
- Creates one **BBQ Report Cards** row with the four component scores and the Event/Team links (plus Category/Judge links when matched).

On success the judge sees a "Scores Submitted!" screen with the total and can submit another.

!!! note "Judge name must match a Judges record to be linked"
    The judge identifier is whatever name the judge types. If it does not match a `Judge Name` in the Judges table, the scorecard is still saved but with no judge link, and it appears as `-` in the admin console. Encourage judges to enter their name consistently, or pre-create Judges records.

!!! warning "No login on the judge or check-in pages"
    The `/scan/...` pages and their endpoints are public by design (judges act off a QR scan, no account). Anyone with a QR link can submit. There is no server-side guard preventing duplicate or extra scorecards per judge/team/category, so a category can end up with more or fewer than the expected six.

## Step 3: One scorecard per judge

Each judge's submission is its own BBQ Report Cards row. A category judged by six judges produces six rows. The platform does not enforce the count of six at submission time; that expectation lives in the engine's validator (`validateJudgeScores`), which is part of the `calculate` path, not the `submit` path.

## Step 4: Review scorecards (admin)

An admin reviews submitted scorecards through the admin console, backed by `GET /api/admin/scorecards`. Unlike the judge pages, this read **requires** the `admin:access` permission. It returns up to 500 report cards, each showing team, event, category, judge, the four component scores, the total, and `totalPenalty`.

!!! note "Penalties are display-only in code"
    `Total Penalty Points` surfaces here from Airtable but the scoring engine never subtracts it. Any penalty effect on standings is applied in Airtable or by hand, not in `scoring.ts`. See [Penalties](../subsystems/scoring-engine.md#penalties).

## Step 5: Finalize (aggregate, weight, rank)

Finalizing means turning the per-judge scorecards into one ranked standing. The engine that performs this, [`src/lib/scoring.ts`](../subsystems/scoring-engine.md), does exactly that:

1. Drops each panel's lowest value per component and averages the remaining five.
2. Weights the components (M 10%, E 50%, A 20%, T 20%) into a category score out of 100.
3. Sums categories into an event total.
4. Computes a tie-break index and ranks teams (ties share a rank).

It is exposed at `POST /api/scoring/calculate`.

!!! danger "The finalize step is not auto-wired in this repo"
    `calculate` expects a hand-assembled payload of teams and 6-judge arrays on the 0-to-100 scale. No reviewed code reads the submitted BBQ Report Cards, reshapes them, and feeds them to the engine. So the path from "six judges submitted" to "official ranked leaderboard" is currently completed outside this code (Airtable formulas, the Google Sheets mirror, or manually). A developer taking over should confirm exactly where final standings are produced before changing the judge form, the submit endpoint, or the engine. Also note the [tie-break precision limitation](../subsystems/scoring-engine.md#step-4-compute-the-deterministic-tie-break-index) in the JavaScript engine.

## Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| Judge shows as `-` in admin | Typed judge name did not match a Judges record |
| Category shows as `Unknown` | Slug did not resolve to a `Category Name` in Airtable |
| Judge notes missing | Expected: notes are never saved (no field) |
| Check-in returns 404 | Bad `eventId` or `teamId` in the QR URL |
| More/fewer than 6 scorecards in a category | No submission-time guard; judges can over- or under-submit |
| Standings look unweighted | Raw scorecards were read without running the engine; see the finalize caveat |

## Related pages

- [Scoring Engine](../subsystems/scoring-engine.md)
- [API: scoring](../api/scoring.md)
