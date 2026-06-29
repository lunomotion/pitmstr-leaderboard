# QR Check-in & Turn-in

QR codes are how teams and judges interact with an event in the physical world. Each printed code encodes a URL into the PITMSTR app. Scanning a code opens a mobile page that either checks a team in or opens a judge scoring form for one food category. The generation side lives in `src/lib/qr.ts`; the scan side lives under `src/app/scan/`.

## QR generation (`src/lib/qr.ts`)

The module wraps the [`qrcode`](https://www.npmjs.com/package/qrcode) npm package. Every code is a PNG encoding an absolute URL.

### Base URL

```ts
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://pitmstr.vercel.app";
```

!!! warning "Verify: production base URL"
    The hard-coded fallback is `https://pitmstr.vercel.app`. In production both `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL` should be set to `https://highschoolbbqleague.com` so printed QR codes resolve to the real domain. If neither is set, every generated code points at the Vercel preview URL.

### URL builders

| Builder | Produces |
|---|---|
| `buildCheckInUrl(eventId, teamId)` | `{BASE_URL}/scan/checkin/{eventId}/{teamId}` |
| `buildTurnInUrl(eventId, teamId, category)` | `{BASE_URL}/scan/turnin/{eventId}/{teamId}/{slug}` |
| `buildTeamPageUrl(teamId)` | `{BASE_URL}/teams/{teamId}` |
| `buildVerificationUrl(verificationId)` | `{BASE_URL}/verify/{verificationId}` |

`buildTurnInUrl` slugifies the category: `category.toLowerCase().replace(/\s+/g, "-")`. So `Pork Ribs` becomes `pork-ribs` in the URL. The scan page reverses this when displaying.

### Rendering codes

Two generators produce the same QR with different output formats:

```ts
generateQRDataUri(url, options?) // -> PNG data URI string (for <Image> in PDFs / HTML)
generateQRBuffer(url, options?)  // -> PNG Buffer
```

Defaults for both: `width: 200`, `margin: 1`, `errorCorrectionLevel: "H"`, black on white. Error correction level `H` (about 30 percent) is chosen so a logo could be overlaid without breaking scannability.

### Team sheet builder

`generateTeamQRSheet(input)` is the high-level entry point used by the QR sheet report routes. Given a team, event, and a list of `categories`, it returns a `TeamQRSheetData` containing:

1. One `CHECK-IN` code (from `buildCheckInUrl`).
2. One code per category, labelled with the upper-cased category name (from `buildTurnInUrl`).

```ts
codes.push({ label: "CHECK-IN", url: checkInUrl, dataUri: await generateQRDataUri(checkInUrl) });
for (const category of input.categories) {
  const turnInUrl = buildTurnInUrl(input.eventId, input.teamId, category);
  codes.push({ label: category.toUpperCase(), url: turnInUrl, dataUri: await generateQRDataUri(turnInUrl) });
}
```

The report routes pass `event.categories.filter((c) => c !== "Overall")` so the synthetic "Overall" category never gets a turn-in code. See [Reports & Certificates](../features/reports.md) for the QR sheet endpoints.

## Check-in flow (`/scan/checkin/[eventId]/[teamId]`)

`src/app/scan/checkin/[eventId]/[teamId]/page.tsx` is a client component. On mount it immediately fires the check-in, with no user input required (scan = checked in):

```ts
const res = await fetch("/api/scoring/checkin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId, teamId }),
});
```

The page renders three states: a loading spinner, a green success card showing team name + event name + timestamp, or a red error card.

### Backend: `POST /api/scoring/checkin`

`src/app/api/scoring/checkin/route.ts`:

1. Validates `eventId` and `teamId` are present (`400` if not).
2. Fetches the team and event in parallel via `getTeam` / `getEvent` (`404` if either is missing).
3. Creates a record in the Airtable **Turn-Ins** table that represents the check-in:

```ts
const checkinFields = {
  Event: [eventId],
  Team: [teamId],
  Notes: `SYSTEM-CHECKIN | Team check-in at ${checkedInAt}`,
  "Submitted At": checkedInAt,
};
```

If Airtable rejects an unknown field (`UNKNOWN_FIELD_NAME`), it retries with only the `Event` and `Team` link fields as a minimal fallback. Returns `{ success, data: { teamName, eventName, checkedInAt } }`.

!!! note "Check-ins live in the Turn-Ins table"
    A check-in is stored as a Turn-Ins row distinguished by the `SYSTEM-CHECKIN` marker in its `Notes`, not in a dedicated table. Keep this in mind when querying turn-in data, those rows are not category scores.

## Turn-in / judge scoring flow (`/scan/turnin/[eventId]/[teamId]/[category]`)

`src/app/scan/turnin/[eventId]/[teamId]/[category]/page.tsx` is a client component implementing a three-step judge scoring wizard. The `category` route param is decoded and de-slugified for display:

```ts
const category = decodeURIComponent(params.category as string)
  .replace(/-/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase());
```

### MEAT components

The form scores four MEAT components, defined in the page:

| Key | Label | Max |
|---|---|---|
| `M` | Mis En Place | 10 |
| `E` | Taste (EAT) | 55 |
| `A` | Appearance | 15 |
| `T` | Texture & Tenderness | 20 |

Total possible is 100. A running total is shown live as the judge types.

### Steps

1. **Enter scores** - judge name (required) plus a numeric input per component (bounded to each component's max), and optional notes. "Review Scores" validates that the name is filled and every component has a valid in-range value.
2. **Confirm** - a read-only summary of the four scores and total, with "Go Back & Edit" or "Confirm & Submit".
3. **Final confirmation modal** - an "Are you sure? This action cannot be undone" guard before the API call.

On submit:

```ts
await fetch("/api/scoring/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    eventId, teamId, category,
    judgeId: judgeId.trim(),
    scores: { M, E, A, T }, // parsed floats
    notes: notes.trim() || undefined,
  }),
});
```

Success advances to a "Scores Submitted!" screen showing the total out of 100.

### Backend: `POST /api/scoring/submit`

`src/app/api/scoring/submit/route.ts` writes one **BBQ Report Cards** record per judge per category:

- Validates presence of `eventId`, `teamId`, `category`, `judgeId`.
- Validates shape to prevent Airtable formula injection: record ids must match `^rec[A-Za-z0-9]{14}$`; names must match a safe-character allowlist (`SAFE_NAME_RE`).
- Validates each score against its MEAT range (`M` 0-10, `E` 0-55, `A` 0-15, `T` 0-20).
- Looks up the Category record id by name and the Judge record id by name or id (both lookups are best-effort and non-fatal).
- Creates the record with the Airtable field names from Mike's base:

```ts
const fields = {
  Event: [body.eventId],
  Team: [body.teamId],
  "Mis En Place (out of 10)": body.scores.M,
  "Taste (out of 55)": body.scores.E,
  "Appearance (out of 15)": body.scores.A,
  "Texture (out of 20)": body.scores.T,
  // Category and Judge links added if their lookups resolved
};
```

The total is computed by an Airtable formula, so only the four components are sent. The route returns the new record id and a client-side `totalScore`.

!!! note "Notes are dropped on turn-in submit"
    The turn-in form collects an optional `notes` field, but the BBQ Report Cards table has no Notes field, so the submit route silently does not persist it (see the inline comment in the route). Check-in records, by contrast, do write to a `Notes` field on Turn-Ins.

```mermaid
flowchart TD
    A[Print QR sheet for team] --> B{Scan a code}
    B -->|CHECK-IN code| C[/scan/checkin/...]
    C --> D[POST /api/scoring/checkin]
    D --> E[(Turn-Ins record, SYSTEM-CHECKIN)]
    B -->|Category code| F[/scan/turnin/.../category]
    F --> G[3-step judge form]
    G --> H[POST /api/scoring/submit]
    H --> I[(BBQ Report Cards record)]
```

## Related pages

- [Reports & Certificates](../features/reports.md) - generating printable QR sheets.
- [API: reports](../api/reports.md) - `qr-sheet` and `qr-sheet-batch` endpoints.
- [PDF & Report Generation](pdf-reports.md) - how the QR sheet PDF is laid out.
