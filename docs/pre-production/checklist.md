# Go-Live Checklist

An ordered, concrete list to take PITMSTR from "works for the developer" to "ready for a real competition." Do the sections roughly in order: ownership and hosting first, then config, then validation, then the day-before steps.

Treat each box as something you can prove, not assume.

## 1. Accounts and ownership

These must belong to the client (NHSBBQA), not LunoMotion. Full detail and transfer steps are in [Handoff & Ownership](../handoff-ownership.md).

- [ ] GitHub repo `lunomotion/pitmstr-leaderboard` access transferred or the client added as owner.
- [ ] Hosting account (Vercel today, or the new host) owned by the client.
- [ ] Clerk application owned by the client's account.
- [ ] Airtable base `appaCm0sgJFrCRmx2` owned by the client; a client-owned API token exists.
- [ ] Stripe account owned by the client (live mode, business verified).
- [ ] Domain registrar for `highschoolbbqleague.com` owned by the client.
- [ ] Every environment key re-issued under client-owned accounts, not personal LunoMotion tokens.

## 2. Hosting and domain live

- [ ] App deploys green on the client-owned host (`npm ci`, `npm run build`, `npm run start`). See [Deployment](../operations/deployment.md).
- [ ] Node version set to 20.x on the host.
- [ ] `highschoolbbqleague.com` resolves to the host and serves over HTTPS with a valid certificate. See [Domain & DNS](../operations/domain-dns.md).
- [ ] `www` and apex both work; one redirects to the other (canonical chosen).

## 3. Environment variables (production scope)

All set on the host, with production values, then a redeploy done. Full list in [Environment Variables](../getting-started/environment.md).

- [ ] `AIRTABLE_API_KEY` (client-owned token) and `AIRTABLE_BASE_ID=appaCm0sgJFrCRmx2`.
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the client's Clerk production instance.
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` set.
- [ ] `STRIPE_SECRET_KEY` (live) and `STRIPE_WEBHOOK_SECRET` from the live webhook endpoint.
- [ ] `ADMIN_PASSWORD` set to a strong value, shared only with authorized admins.
- [ ] `NEXT_PUBLIC_BASE_URL=https://highschoolbbqleague.com`.
- [ ] `NEXT_PUBLIC_APP_URL=https://highschoolbbqleague.com`.

!!! danger "QR codes break if the URL vars are wrong"
    `NEXT_PUBLIC_APP_URL` drives QR generation. If it still points at localhost or a preview URL, every printed QR at the event is wrong. Double-check this one.

## 4. External services pointed at production

- [ ] Clerk production instance lists `highschoolbbqleague.com` as an allowed origin.
- [ ] Clerk webhook (if used for user sync) points at `/api/webhooks/clerk`.
- [ ] Stripe live webhook points at `https://highschoolbbqleague.com/api/webhooks/stripe`, subscribed to `checkout.session.completed`.
- [ ] `next.config.ts` `images.remotePatterns` includes any new image/logo host you rely on.

## 5. Roles configured

See [Roles & Permissions](../auth-rbac/roles.md).

- [ ] Mike (and any co-admins) have the NHSBBQA Admin role in Clerk `publicMetadata`.
- [ ] At least one State Director account configured and verified for a real state.
- [ ] A test Teacher account can register a school and team.
- [ ] Judge access via QR scan works without login (scan routes are public by design).

## 6. Data seeded (real, not demo)

- [ ] Real divisions present using official names (KIDSQ, MSBBQ, HSBBQ, HSBBQ Unified, CBBQ, OBBQ). Do not ship legacy strings like "OPEN KQ".
- [ ] Real states / state associations (`[STATE]HSBBQA`) configured.
- [ ] Real upcoming event(s) created with correct dates, categories, and charter fee ($250/team).
- [ ] Categories and scoring config match the MEAT scoring packet.
- [ ] All demo/seed rows removed from the production base (run a cleanup pass through the admin console).

## 7. Payments validated

- [ ] Vendor Documents uploaded in Airtable (W-9, ACH, Insurance, Sole Source, Procurement, District Adoption) so the Payment Package ZIP works. See [Invoicing & Payments](../features/billing.md).
- [ ] A test invoice generates a correct PDF.
- [ ] A Stripe checkout (test mode first, then a small live test) completes and the webhook flips the invoice to paid.
- [ ] The public pay page `/pay/[invoiceId]` loads and shows the right amount.

## 8. Compliance and waivers

See [Compliance & Waivers](../features/compliance.md).

- [ ] FERPA posture confirmed: student data is access-controlled and not publicly exposed.
- [ ] Decision made on liability waiver and handbook-agreement checkboxes at registration. If required for launch, they are built and tested. (Currently on the [roadmap](../roadmap.md), not built.)

## 9. Backups and monitoring

See [Monitoring & Backups](../operations/monitoring.md).

- [ ] Fresh Airtable base snapshot taken (Duplicate base, dated).
- [ ] Google Sheets mirror confirmed current and owned by the client, or replaced.
- [ ] Uptime monitor pinging the domain and alerting a real inbox.
- [ ] A developer is on call for event day with host log access.

## 10. Final rehearsal

- [ ] Run the [Mock Competition Test Plan](mock-test.md) end to end.
- [ ] Sample contest created for the rehearsal is deleted afterward.
- [ ] Any issues found in the mock are fixed and re-verified.

When every box is checked, PITMSTR is ready for a real competition.
