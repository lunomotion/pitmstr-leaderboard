# Mock Competition Test Plan

A two-day rehearsal that proves real people can use PITMSTR before a real competition. Recruit about 20 teachers. Day one tests registration and login. Day two tests judging and data entry. Everything happens against a sample contest created in the admin console and deleted at the end.

This page is written as a runnable script. Follow it in order.

## Goals

- Prove a brand-new teacher can register a school and team and log in without help.
- Prove a judge can score a turn-in from a phone via QR.
- Prove an admin can enter and review results and that the data lands correctly in Airtable.
- Surface any confusing step, broken link, or wrong number before it happens for real.

## Prerequisites (the day before)

Complete these before day one. Most reference the [Go-Live Checklist](checklist.md).

1. The platform is reachable at its production (or a dedicated staging) URL over HTTPS.
2. All environment variables are set and a redeploy is done.
3. A fresh Airtable snapshot is taken so the mock data can be cleaned cleanly afterward.
4. About 20 teachers are recruited and have the URL and a short "what to expect" note.
5. An admin (Mike or a delegate) has access to the [Admin Console](../features/admin-console.md).
6. A developer is on call to watch logs and fix issues.

### Create the sample contest

In the admin console:

1. Go to Events, create an event named clearly, for example `MOCK RUN - 2026-09` so it is obviously not real.
2. Set realistic dates, a real division (for example HSBBQ), and the standard categories from the MEAT scoring packet.
3. Note the event id; you will use it in QR links and cleanup.

!!! tip "Use a staging Airtable base if you can"
    If a separate staging base exists, point the mock at it so production data is never touched. If you must use production, the cleanup step at the end removes everything created here.

## Day 1: Register and log in (teachers)

Goal: every teacher independently creates an account, registers a school, and creates a team.

### Brief the teachers (5 minutes)

Tell them: "You are a coach signing your school up to compete. Create your account, register your school, and add one team. If anything is confusing, tell us exactly where you got stuck."

### Teacher steps (each participant)

1. Open the site URL.
2. Click sign up and create an account at `/sign-up` (Clerk handles this: email OTP or social login).
3. After signing in, land on the dashboard.
4. Register a school (use a fake but realistic school name like `Mock High - <your initials>`).
5. Create a team under that school, choose the division, and enter the team details.
6. If a charter fee / invoice step appears, walk through it up to the payment screen. Do not pay with a real card. Use Stripe test mode if the environment is in test mode; otherwise stop at the pay page.
7. Sign out, then sign back in to confirm the account persists and the team is still there.

### What the observer/admin watches

- Did everyone reach the dashboard without help? Note who got stuck and where.
- Did each school and team appear in the [Admin Console](../features/admin-console.md) and in Airtable?
- Were division names correct (official names, not legacy strings)?
- Did any invoice generate with the right amount ($250/team)?

### Day 1 success criteria

- [ ] At least 18 of 20 teachers self-registered without one-on-one help.
- [ ] Every registered team is visible in the admin console.
- [ ] Re-login works for everyone.
- [ ] Any blocker is written down with the exact screen and step.

End of day one: collect notes. Fix any blocking issue before day two.

## Day 2: Judging and data entry

Goal: prove the scoring path works end to end, from a judge scanning a QR to results appearing for an admin.

### Set up turn-ins

As admin:

1. For the sample event, generate the QR sheets. The reports endpoints produce per-team and batch QR PDFs (`/api/reports/qr-sheet`, `/api/reports/qr-sheet-batch`). See [QR Check-in & Turn-in](../subsystems/qr-flows.md).
2. Print or display the QR codes for a handful of the mock teams.

### Assign roles for the day

- A subset of teachers act as **judges**.
- One or two act as **admins** doing data entry and review.

### Judge steps (each judge)

1. On a phone, scan a team's turn-in QR code (or open the `/scan/turnin/[eventId]/[teamId]/[category]` link). No login is required for judges.
2. The scoring form opens for that team and category.
3. Enter scores per the MEAT scoring rubric. See [Scoring & Judging](../features/scoring-judging.md).
4. Submit. Confirm a success state appears.
5. Repeat for another team or category.

### Check-in flow (optional but recommended)

1. Scan a team check-in QR (`/scan/checkin/[eventId]/[teamId]`).
2. Confirm the team shows as checked in.

### Admin data entry and review

1. In the admin console, open the event's turn-ins and confirm submitted scores arrived.
2. Manually enter or correct a score through the admin turn-ins UI to test the data-entry path.
3. Open the [Leaderboard](../features/leaderboard.md) for the event and confirm rankings compute and look right.
4. Generate an event results PDF (`/api/reports/event-results`) and a sample report card. See [Reports & Certificates](../features/reports.md).

### What the observer watches

- Did QR scans open the right team and category every time?
- Did scores submitted on phones appear for the admin and in Airtable?
- Did the leaderboard math match hand calculation on at least one team?
- Did any judge hit an error or a confusing field?

### Day 2 success criteria

- [ ] Every judge submitted at least one score from a phone without help.
- [ ] Submitted scores appear in the admin console and Airtable.
- [ ] The leaderboard ranks teams correctly.
- [ ] Reports generate without error.

## After the mock: clean up

1. In the admin console, delete the sample event (`MOCK RUN - ...`) and its teams.
2. Remove the mock schools and teams created by teachers.
3. Remove any mock invoices.
4. If you used production, confirm the base is back to only real data; compare against the snapshot taken beforehand.
5. Revoke or reset any test-only access.

!!! warning "Delete the sample contest before real use"
    Leaving a mock event or mock teams in production pollutes leaderboards and reports. Confirm cleanup is complete and re-take a clean Airtable snapshot afterward.

## Debrief

Collect every blocker and confusing step from both days. For each: decide fix now, fix later, or accept. Anything that blocked a teacher or judge from completing the core task is a launch blocker and goes back onto the [Go-Live Checklist](checklist.md) before a real competition.
