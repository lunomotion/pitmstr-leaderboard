# Handoff & Ownership

The goal of this page is simple: after the handoff, NHSBBQA (Mike Erickson) owns every account PITMSTR depends on, and nothing stays locked to LunoMotion. This is the master inventory and the transfer checklist.

!!! danger "Until every row below is transferred, the client does not fully own the platform"
    The app code is portable, but it is useless without the accounts that run it. A transfer is only complete when the client can log in to each service independently of LunoMotion and revoke LunoMotion's access if they choose.

## Account inventory

| Service | What it holds | Why it matters | Current owner | Transfer to client by |
|---|---|---|---|---|
| **GitHub** `lunomotion/pitmstr-leaderboard` | All application source code (`main`) | The app itself; required to deploy or change anything | LunoMotion | Transfer the repo to a client-owned GitHub org, or add the client as owner and have them fork/clone |
| **Hosting** (Vercel today) | Builds and serves the site; holds production env vars | Where the app runs | LunoMotion Vercel account | Move project to client Vercel team, or redeploy on a client-owned host (see [Deployment](operations/deployment.md)) |
| **Clerk** | Users, sessions, roles (`publicMetadata`) | Authentication; without it nobody logs in | LunoMotion (verify) | Transfer the Clerk app to the client's Clerk account, re-issue keys |
| **Airtable** base `appaCm0sgJFrCRmx2` | All platform data (system of record) | The database; losing it loses everything | LunoMotion (verify) | Transfer base ownership to a client Airtable account; issue a client-owned API token |
| **Stripe** | Payments, invoices paid, payout bank | The money; must be the client's legal entity | LunoMotion or client (verify) | Ensure the Stripe account is the client's business; re-issue API and webhook keys |
| **Domain registrar** (HighSchoolBBQLeague.com) | The domain and DNS control | Controls the public address | Unknown, verify | Transfer the domain to a client registrar account, or transfer the existing account's login |
| **Google Sheets backup** | Mirror of Airtable data | Backup of the system of record | Unknown, verify | Confirm owner, move to a client-owned Google account |
| **Environment keys** | Secrets that wire it all together | The app does not run without them | Held in host env + `.env.local` (LunoMotion) | Re-issue every key under client-owned accounts and set them on the client's host |

!!! warning "Verify the unknowns"
    The repo does not record who currently owns Clerk, Airtable, Stripe, the domain registrar, or the Google Sheets backup. Confirm each by logging in. Any account whose owner you cannot establish is the highest-priority item to recover, because it cannot be transferred until it is found.

## Environment keys that must be re-issued

Every secret should be regenerated under client-owned accounts, not copied from LunoMotion's personal tokens. Full descriptions in [Environment Variables](getting-started/environment.md).

| Variable | Re-issue from |
|---|---|
| `AIRTABLE_API_KEY` | Client's Airtable account, scoped to base `appaCm0sgJFrCRmx2` |
| `AIRTABLE_BASE_ID` | Stays `appaCm0sgJFrCRmx2` (the base id does not change on ownership transfer) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client's Clerk app |
| `CLERK_SECRET_KEY` | Client's Clerk app |
| `STRIPE_SECRET_KEY` | Client's Stripe account |
| `STRIPE_WEBHOOK_SECRET` | Client's Stripe webhook endpoint |
| `ADMIN_PASSWORD` | Set fresh by the client |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` / `AFTER_*` | Same route values, re-set on the client host |
| `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` | `https://highschoolbbqleague.com` |

## Ownership transfer checklist

Work top to bottom. Each step ends with the client able to operate that piece without LunoMotion.

### Code

- [ ] Client has a GitHub organization or account.
- [ ] Repo transferred to the client org (or client added as an owner/admin).
- [ ] Client can clone, branch, and merge to `main`.
- [ ] LunoMotion access reduced to whatever the client wants going forward (or removed).

### Hosting

- [ ] Client has a host account (their own Vercel team, or the chosen alternative host).
- [ ] App deploys green from the client's repo on the client's host.
- [ ] All production environment variables set on the client host.
- [ ] Production domain serves from the client host over HTTPS.
- [ ] Old LunoMotion deployment decommissioned after cutover.

### Authentication (Clerk)

- [ ] Client owns the Clerk application.
- [ ] Production instance lists `highschoolbbqleague.com` as an allowed origin.
- [ ] New Clerk keys set on the client host.
- [ ] Existing users and roles intact after transfer (verify a known admin can still sign in).
- [ ] Clerk webhook (if used) points at `/api/webhooks/clerk`.

### Database (Airtable)

- [ ] Client owns the Airtable base `appaCm0sgJFrCRmx2`.
- [ ] Client-owned API token created and set as `AIRTABLE_API_KEY`.
- [ ] A fresh backup snapshot taken before and after transfer.
- [ ] Google Sheets mirror confirmed, re-owned, or replaced.

### Payments (Stripe)

- [ ] Stripe account is the client's legal business entity with a verified payout bank.
- [ ] New Stripe API key set on the client host.
- [ ] Live webhook endpoint points at `https://highschoolbbqleague.com/api/webhooks/stripe`, subscribed to `checkout.session.completed`.
- [ ] New webhook signing secret set as `STRIPE_WEBHOOK_SECRET`.
- [ ] A test checkout marks an invoice paid end to end.

### Domain

- [ ] Registrar account for `highschoolbbqleague.com` owned by the client.
- [ ] DNS points at the client host; HTTPS valid.
- [ ] Email records (MX, SPF, DKIM, DMARC) preserved if email runs on the domain.

### Final verification

- [ ] Client can independently: deploy a change, log in as admin, take a payment, and read logs.
- [ ] Every key in the table above is a client-owned credential, not a LunoMotion one.
- [ ] LunoMotion access removed from any account the client wants exclusive control of.
- [ ] This documentation site and the repo handoff packet (`Stage1_5_Handoff/`) are in the client's possession.

When every box is checked, the platform is fully owned by NHSBBQA. For the deployment mechanics referenced here, see [Deployment](operations/deployment.md); for DNS, see [Domain & DNS](operations/domain-dns.md).
