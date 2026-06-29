# Pre-Production

Before PITMSTR runs a real competition with real teachers, students, judges, and payments, a set of things must be true. This section makes those explicit and gives you a way to prove the platform is ready.

## The two gates

There are two things to clear before go-live:

1. **The [Go-Live Checklist](checklist.md)**: a concrete, ordered list covering domain, environment, account ownership, payments, roles, seeded data, waivers, and backups. Every item is something you can verify and check off.
2. **The [Mock Competition Test Plan](mock-test.md)**: a two-day rehearsal with about 20 teachers that exercises the real user journeys (register and log in on day one; judge and enter data on day two) against a sample contest that gets deleted afterward.

Clear the checklist first, then run the mock. The mock is the proof; the checklist is the preparation.

## Why both

The checklist proves the **system** is configured: the right keys in the right places, the domain live, payments tested, backups taken. The mock proves the **humans** can use it: that a teacher who has never seen the platform can register a team, that a judge can score a turn-in from a phone, that the data lands where admins expect.

A green checklist with no mock means you launched on untested human workflows. A successful mock on a misconfigured system means you proved a demo, not production. Do both.

## Readiness summary

At a high level, PITMSTR is ready for a real competition when:

| Area | Ready when |
|---|---|
| Hosting | App is on client-owned hosting (or Vercel ownership transferred), building green |
| Domain | `highschoolbbqleague.com` serves the app over HTTPS |
| Environment | All production keys set; both base-URL vars point at the real domain |
| Accounts | GitHub, host, Clerk, Airtable, Stripe, registrar all owned by the client |
| Auth & roles | Admin, teacher, judge, state-director roles configured and tested |
| Payments | A real (or test-mode) Stripe checkout completes and marks the invoice paid |
| Data | Real events, divisions, and schools seeded; demo data removed |
| Compliance | Liability waiver and handbook agreement present on registration (see roadmap) |
| Backups | Fresh Airtable snapshot taken; backup routine documented |
| Monitoring | Uptime check live; a developer on call for event day |

!!! warning "Waivers are a known gap"
    Liability waiver and handbook-agreement checkboxes on the registration flow are on the [roadmap](../roadmap.md), not yet built. Decide before a real competition whether they are required for launch, and if so, build them first. See [Compliance & Waivers](../features/compliance.md).

Work through the [checklist](checklist.md) next.
