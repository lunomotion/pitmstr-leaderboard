# API: scoring

Three endpoints live under `src/app/api/scoring/`. They cover the live-event judging path: a team checks in, judges submit scorecards, and (separately) a caller can run the pure scoring engine over an assembled payload.

| Endpoint | Method | Auth | Purpose | Airtable write |
|---|---|---|---|---|
| `/api/scoring/checkin` | POST | None | Record a team check-in at an event | Creates a **Turn-Ins** row |
| `/api/scoring/submit` | POST | None | Save one judge's MEAT scorecard | Creates a **BBQ Report Cards** row |
| `/api/scoring/calculate` | POST | None | Run the MEAT engine over a payload | None (pure compute) |

!!! warning "These three endpoints are unauthenticated"
    None of `checkin`, `submit`, or `calculate` call Clerk or any permission check. They are reachable by anyone who has the URL. This is intentional for the QR flow: judges and teams scan a code at the event and act without logging in. The read-side counterpart, `GET /api/admin/scorecards`, **does** require `admin:access` (see [Reading scorecards back](#reading-scorecards-back)). Keep this asymmetry in mind: write is open, the admin read is gated.

All three follow the same response envelope:

```json
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": "human readable message" }
```

---

## POST /api/scoring/calculate

Runs the [scoring engine](../subsystems/scoring-engine.md) over a fully assembled payload and returns ranked teams. **Pure compute: it reads and writes no Airtable data.**

**Auth:** none.

### Request body

```json
{
  "teams": [
    {
      "teamId": "string",
      "teamName": "string",
      "schoolName": "string",
      "state": "string",
      "division": "string",
      "categoryScores": [
        {
          "categoryName": "Ribs",
          "judges": [
            { "judgeId": "j1", "M": 80, "E": 90, "A": 85, "T": 88 }
          ]
        }
      ]
    }
  ]
}
```

Each component (`M`, `E`, `A`, `T`) is on the engine's **0 to 100** scale, and each category is expected to carry **6 judges**. See [the engine doc](../subsystems/scoring-engine.md#inputs) for the scale caveat.

### Behavior

1. Rejects a missing or empty `teams` array with `400`.
2. Validates every team: `teamId` and `teamName` are required, and every category passes `validateJudgeScores` (6 judges, each component a number 0-100). All validation errors are collected and returned together.
3. Scores each team with `scoreTeamEvent`, then ranks them with `rankTeams`.
4. Returns the ranked teams plus metadata.

### Success response (200)

```json
{
  "success": true,
  "data": {
    "rankedTeams": [ /* TeamEventScore[], sorted, with rank assigned */ ],
    "metadata": {
      "totalTeams": 12,
      "categories": ["Ribs", "Chicken"],
      "maxPossible": 200,
      "generatedAt": "2026-06-28T00:00:00.000Z"
    }
  }
}
```

`categories` is the de-duplicated set of category names across all teams. `maxPossible` is read from the first ranked team (`rankedTeams[0]?.maxPossible || 0`).

### Error responses

| Status | When | Shape |
|---|---|---|
| 400 | `teams` missing or empty | `{ success: false, error: "Request must include a non-empty 'teams' array" }` |
| 400 | Validation failures | `{ success: false, error: "Validation errors in judge scores", validationErrors: [...] }` |
| 500 | Unexpected error | `{ success: false, error: "Internal server error during scoring calculation" }` |

Each entry in `validationErrors` is `{ teamId, errors: [{ field, message }] }`, where `field` is namespaced as `"<categoryName>.<originalField>"`.

!!! note "calculate is not wired to submitted scorecards"
    This endpoint expects the caller to assemble the full payload. It does not query the BBQ Report Cards that `submit` writes. See [the engine doc](../subsystems/scoring-engine.md#mismatch-between-the-engine-and-the-submission-path) for why this matters.

---

## POST /api/scoring/submit

Saves **one judge's** MEAT scorecard for one team in one food category. Called by the QR judge scoring form at `/scan/turnin/[eventId]/[teamId]/[category]`.

**Auth:** none.

**Writes to:** the Airtable **BBQ Report Cards** table (one new row per call).

### Request body

```json
{
  "eventId": "recXXXXXXXXXXXXXX",
  "teamId": "recXXXXXXXXXXXXXX",
  "category": "St Louis Ribs",
  "judgeId": "Jane Smith",
  "scores": { "M": 9, "E": 50, "A": 13, "T": 18 },
  "notes": "optional free text"
}
```

!!! warning "Component ranges differ from the engine"
    `submit` validates the **raw-point** MEAT scale, not the 0-100 engine scale:

    | Field | Label | Range |
    |---|---|---|
    | `M` | Mis En Place | 0 to 10 |
    | `E` | Taste | 0 to 55 |
    | `A` | Appearance | 0 to 15 |
    | `T` | Texture | 0 to 20 |

    These sum to a maximum of 100. No weighting and no drop-lowest happen here; those are engine concerns.

### Validation and injection guarding

- `eventId`, `teamId`, `category`, and `judgeId` are all required.
- `eventId` and `teamId` must match an Airtable record-id shape: `^rec[A-Za-z0-9]{14}$`.
- `category` must match a safe-name allowlist: `^[A-Za-z0-9 .\-'&()]{1,100}$`.
- `judgeId` must be either a record id **or** a safe name (judges are looked up by typed name).
- Each score must be a number within its range above.

The allowlists exist to prevent Airtable `filterByFormula` injection: rather than escaping input, the route rejects anything containing characters (such as a double quote) that could break out of the formula string literal.

### Airtable lookups (best-effort)

Before writing, the route resolves two linked records by name. Both are wrapped in `try/catch` and only `console.warn` on failure:

```ts
// Categories: match by name
filterByFormula: `LOWER({Category Name}) = LOWER("${body.category}")`
// Judges: match by name OR record id
filterByFormula: `OR(LOWER({Judge Name}) = LOWER("${body.judgeId}"), RECORD_ID() = "${body.judgeId}")`
```

If a lookup finds no record (or throws), the corresponding link field is simply omitted from the new row. **The scorecard is still created.**

### The row that gets written

```ts
const fields = {
  Event: [body.eventId],
  Team: [body.teamId],
  "Mis En Place (out of 10)": body.scores.M,
  "Taste (out of 55)": body.scores.E,
  "Appearance (out of 15)": body.scores.A,
  "Texture (out of 20)": body.scores.T,
};
if (categoryRecordId) fields["Category"] = [categoryRecordId];
if (judgeRecordId)    fields["Judge"]    = [judgeRecordId];

const record = await base("BBQ Report Cards").create(fields);
```

`Total Score` is **not** written by the route; the comment notes it is computed by an Airtable formula. The endpoint still returns a `totalScore` it sums locally (`M + E + A + T`) for display only.

!!! warning "Two silent drops to know about"
    - **Notes are discarded.** The form sends `notes`, but the BBQ Report Cards table has no Notes field, so the route never includes it. The code comment says so explicitly.
    - **Unmatched judge name = no judge link.** `judgeId` is the judge's typed name. If it does not match a Judges record, the scorecard is saved with no `Judge` link and will show as `"-"` in the admin view.

### Success response (200)

```json
{
  "success": true,
  "data": {
    "id": "recNEWCARDID000000",
    "totalScore": 90,
    "message": "Score submitted successfully"
  }
}
```

### Error responses

| Status | When |
|---|---|
| 400 | Missing required field, bad `eventId`/`teamId`/`category`/`judgeId` shape, missing `scores`, or any score out of range |
| 500 | Airtable create failed (the underlying error message is returned) |

---

## POST /api/scoring/checkin

Records that a team has arrived at an event. Called by the team check-in QR page at `/scan/checkin/[eventId]/[teamId]`.

**Auth:** none.

**Writes to:** the Airtable **Turn-Ins** table (one new row per call).

### Request body

```json
{ "eventId": "string", "teamId": "string" }
```

### Behavior

1. Both `eventId` and `teamId` are required, else `400`.
2. Loads the team and event in parallel via `getTeam` and `getEvent` (from `src/lib/airtable.ts`) to validate they exist and to get display names. Missing team or event returns `404`.
3. Creates a Turn-Ins row tagged as a check-in:

```ts
const checkinFields = {
  Event: [eventId],
  Team: [teamId],
  Notes: `SYSTEM-CHECKIN | Team check-in at ${checkedInAt}`,
  "Submitted At": checkedInAt, // new Date().toISOString()
};
await base("Turn-Ins").create(checkinFields);
```

If Airtable rejects an unknown field (`UNKNOWN_FIELD_NAME`), the route retries with a minimal row of just the `Event` and `Team` links:

```ts
await base("Turn-Ins").create({ Event: [eventId], Team: [teamId] });
```

Any other error is re-thrown and becomes a `500`.

!!! note "Check-ins share the Turn-Ins table"
    A check-in is not a separate table; it is a Turn-Ins row distinguished by the `SYSTEM-CHECKIN` prefix in its `Notes`. Anything that counts or lists real turn-ins should filter these out (or filter them in, if counting attendance).

### Success response (200)

```json
{
  "success": true,
  "data": {
    "teamName": "Smokey Joes",
    "eventName": "Spring Regional 2026",
    "checkedInAt": "2026-06-28T00:00:00.000Z"
  }
}
```

### Error responses

| Status | When |
|---|---|
| 400 | `eventId` or `teamId` missing |
| 404 | Team not found, or event not found |
| 500 | Airtable failure other than `UNKNOWN_FIELD_NAME` |

---

## Reading scorecards back

The submitted BBQ Report Cards are read by a separate, **admin-gated** endpoint, `GET /api/admin/scorecards`:

```ts
const auth = await requirePermission("admin:access");
if (isAuthError(auth)) return auth;
```

It returns up to 500 report cards, each flattened to:

```json
{
  "id": "rec...",
  "name": "",
  "teamName": "Smokey Joes",
  "eventName": "Spring Regional 2026",
  "category": "Ribs",
  "judgeName": "Jane Smith",
  "scores": { "M": 9, "E": 50, "A": 13, "T": 18 },
  "totalScore": 90,
  "totalPenalty": 0
}
```

`teamName`, `eventName`, `category`, and `judgeName` come from Airtable lookup fields and fall back to `"Unknown"` / `"-"` when absent. `totalScore` prefers Airtable's `Total Score`, falling back to `M + E + A + T`. `totalPenalty` reads `Total Penalty Points`, which the scoring engine never applies (see [Penalties](../subsystems/scoring-engine.md#penalties)).

## Related pages

- [Scoring Engine](../subsystems/scoring-engine.md) -- the math behind `calculate`.
- [Scoring & Judging](../features/scoring-judging.md) -- the event-day flow these endpoints support.
