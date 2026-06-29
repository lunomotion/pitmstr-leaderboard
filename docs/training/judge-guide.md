# Judge Guide

For judges scoring at a competition. You score turn-ins from your phone by scanning a QR code. You do not need an account or a password.

## What you need

- A smartphone with a camera and internet.
- The QR code at the turn-in table (the admin prints one per team and category).

That is it. Judges score without logging in by design, so the flow is fast at the table.

## How scoring works at the table

1. A team turns in their entry for a category (for example a specific meat).
2. You scan the QR code for that team and category. It opens the scoring form for exactly that team and category.
3. You score the entry on the rubric.
4. You submit. Done. Move to the next entry.

## Step by step

### 1. Scan the turn-in QR

1. Open your phone camera (or a QR scanner) and point it at the turn-in QR code.
2. Tap the link that appears. It opens a page like `/scan/turnin/<event>/<team>/<category>`.
3. Confirm the page shows the correct team and category before you score. If it looks wrong, do not score; flag the table admin.

### 2. Score the entry

1. The form shows the scoring criteria for the category. PITMSTR uses the NHSBBQA MEAT scoring rubric. See [Scoring & Judging](../features/scoring-judging.md) for what each criterion means.
2. Enter your scores for each criterion.
3. Double-check your numbers. Submitting is the official record.

!!! tip "Score the entry in front of you, not the team"
    Judging is blind to who the team is wherever possible. Score the food on the rubric.

### 3. Submit

1. Tap submit.
2. Wait for the success confirmation before walking away. If you do not see a confirmation, the score may not have saved; try again or tell the table admin.
3. Move to the next turn-in.

## Check-in scans (if you help with check-in)

Some events also use a check-in QR (`/scan/checkin/<event>/<team>`). Scanning it marks a team as checked in. This is separate from scoring.

## Common issues

| Problem | What to do |
|---|---|
| QR will not scan | Improve lighting, hold steady, or ask the admin for the link |
| Wrong team or category shown | Do not score; tell the table admin, scan the correct code |
| No success message after submit | Re-check your connection and resubmit; tell the admin if it persists |
| Form will not load | Check phone signal; the admin can hand you the direct link |

## What happens to your score

Your submitted score goes straight into the system (Airtable Turn-Ins) and feeds the [leaderboard](../features/leaderboard.md) and the team's report card. Admins can review and reconcile scores afterward in the admin console.
