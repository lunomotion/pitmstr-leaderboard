# API: leaderboard and stats

Two public read routes that power the leaderboard and the homepage counters.

Source files:

- `src/app/api/leaderboard/route.ts`
- `src/app/api/stats/route.ts`

---

## `GET /api/leaderboard`

Ranked standings for one event, optionally filtered to a single category.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET` -> `getEventLeaderboard(eventId, category)` |

### Request

| Param | Type | Required | Notes |
|---|---|---|---|
| `eventId` | string | yes | Airtable event record ID. `400` if missing. |
| `category` | string | no | Defaults to `Overall`. When `Overall`, all categories are aggregated; otherwise only that category's report cards count. |

### How the score is computed

`getEventLeaderboard` does the work:

1. Loads the event record and reads its linked `Teams`. If none, returns `[]`.
2. Fetches up to 1000 `BBQ Report Cards` and filters to those linked to this event.
3. For each report card belonging to a participating team, accumulates `Total Score` and a count, plus per-category subtotals. When `category` is not `Overall`, report cards for other categories are skipped.
4. Each team's `score` is the average (`total / count`), rounded to 2 decimals, not a sum.
5. Teams are sorted by score descending and assigned `rank` starting at 1. Teams with no report cards get a score of `0`.

### Response

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "teamId": "rec...",
      "teamName": "...",
      "schoolName": "...",
      "schoolId": "rec...",
      "state": "TX",
      "division": "...",
      "score": 178.5,
      "categoryScores": { "Brisket": { "score": 180.0, "rank": 0 } }
    }
  ]
}
```

Note: `rank` inside `categoryScores` is left at `0` (not computed). Sent with `Cache-Control: public, s-maxage=10, stale-while-revalidate=30` to keep judge feedback near-real-time while limiting Airtable reads during events.

### Side effects

None. Read only.

!!! warning "Verify: full Report Cards scan per request"
    The leaderboard fetches up to 1000 report cards on every call and filters in memory, then fetches each team individually. With short cache TTL plus heavy event traffic this can be Airtable-rate-limit sensitive. Confirm scale assumptions before a large event.

---

## `GET /api/stats`

Aggregate platform counters for the homepage.

| | |
|---|---|
| **Auth** | None (public) |
| **Handler** | `GET`, four parallel Airtable table scans |

### Request

No parameters.

### Behavior

Runs four `select().all()` scans in parallel against `Events`, `Teams` (fetching only `State`), `Charter`, and `Students`, then counts records. Unique states are derived from non-empty `State` values on team rows.

### Response

```json
{
  "success": true,
  "data": { "events": 12, "teams": 84, "schools": 30, "students": 410, "states": 9 }
}
```

Sent with `Cache-Control: public, s-maxage=120, stale-while-revalidate=300`.

### Side effects

None. Read only.

!!! warning "Verify: error path returns HTTP 200 and omits students"
    On failure the route returns HTTP `200` with `success: false` and a zeroed `data` object that is missing the `students` key (it includes `events`, `teams`, `schools`, `states` only). Clients should not treat a `200` from this route as proof of success, and should not assume `data.students` is always present.
