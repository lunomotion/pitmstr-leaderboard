# State Director Guide

For a state director managing their state's presence on PITMSTR. You oversee the schools, teams, and registrations within your one state association.

## What a state director does

The State Director role is scoped to a single state. You can:

- View and manage the schools and teams registering in your state.
- See registrations and their status for your state.
- Manage your state's page and information.
- Track your state's events and results.

You see your own state's data, not other states'. National-level actions belong to the NHSBBQA admin.

!!! warning "Verify the exact state-director permissions in your build"
    The precise actions available to a state director (what you can edit vs view, and approval rights over new schools/teams) are defined in code and Clerk role config. Confirm against [Roles & Permissions](../auth-rbac/roles.md) and the [Admin Console](../features/admin-console.md), and ask your NHSBBQA admin if an action you expect is missing.

## Getting set up

1. Create an account at `/sign-up` and sign in.
2. Your NHSBBQA admin assigns you the State Director role for your specific state (this is set in Clerk and tied to your state).
3. Sign out and back in so the role takes effect.
4. Open your dashboard. You should now see your state's view (`/dashboard/state`).

If you do not see state-level tools after re-logging in, contact your NHSBBQA admin to confirm your role and state assignment.

## Your state's naming

State associations follow the official pattern `[STATE]HSBBQA`, for example `TXHSBBQA` or `FLHSBBQA`. Use the official name for your state. Divisions use official names too: KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ. Do not use legacy strings.

## Managing schools and registrations

1. From your state dashboard, review schools and teams registering in your state.
2. Confirm details look right: correct school, correct division, correct contact teacher.
3. If your role includes approving new schools or teams, work through any pending items so teachers are not stuck waiting. Pending registrations are visible under the pending view.
4. Coordinate with teachers in your state on charter fees and deadlines. Billing itself is handled by the NHSBBQA admin; see [Invoicing & Payments](../features/billing.md).

## Your state's page and information

1. Keep your state's information current: contacts, key dates, and any state-specific notes.
2. As events approach, confirm the teams in your state are registered and active.

## Events and results

1. During and after events in your state, follow turn-ins and results.
2. Review the [leaderboard](../features/leaderboard.md) filtered to your state's teams.
3. Coordinate with the NHSBBQA admin on certificates and report cards for your state. Per-state certificate automation (multiple certificate types, only the state name and logo changing) is a planned future phase, not yet built. See the [Roadmap](../roadmap.md).

## Compliance reminder

Student data is protected under FERPA. Treat rosters and student details as confidential and share them only with authorized people. See [Compliance & Waivers](../features/compliance.md).

## Getting help

- A school or team in your state is missing or stuck: check pending registrations, then contact your NHSBBQA admin.
- You cannot do something you expect to: confirm your role and state assignment with the NHSBBQA admin.
- A billing question from a teacher: route it to the NHSBBQA billing admin.
