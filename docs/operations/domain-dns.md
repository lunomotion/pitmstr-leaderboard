# Domain & DNS

The production domain is **HighSchoolBBQLeague.com**. This page explains how to point it at the host and manage its DNS records, both for the current Vercel setup and for a future client-owned host.

## Key facts

| Item | Value |
|---|---|
| Production domain | `highschoolbbqleague.com` |
| Recommended canonical host | `www.highschoolbbqleague.com` or the apex, pick one and redirect the other |
| Registrar | Where the domain was purchased |
| DNS host | Wherever the nameservers point (registrar, Cloudflare, or the app host) |

!!! warning "Verify registrar and DNS host"
    The exact registrar and current DNS host are not stored in the repo. Log in to the domain registrar account for HighSchoolBBQLeague.com to confirm who controls DNS today. This account must transfer to the client as part of [handoff](../handoff-ownership.md). If you cannot find it, that is the first thing to recover.

## How DNS pointing works (plain version)

A visitor types `highschoolbbqleague.com`. DNS translates that name into the address of the server that runs the app. You change two kinds of record:

- **A record**: maps the apex (`highschoolbbqleague.com`) to an IPv4 address.
- **CNAME record**: maps a subdomain (`www.highschoolbbqleague.com`) to another hostname (for example a Vercel or managed-host target).

Your host tells you exactly which record values to use. You then enter those values at whoever controls DNS.

## Current setup: domain on Vercel

If the domain is attached to the Vercel project:

1. In the Vercel project, open Settings, Domains. Confirm `highschoolbbqleague.com` and `www.highschoolbbqleague.com` are listed and show "Valid Configuration".
2. Vercel shows the required records. Typically:
   - Apex `highschoolbbqleague.com`: an `A` record to Vercel's IP, or an `ALIAS`/`ANAME` if the DNS host supports it.
   - `www`: a `CNAME` to the Vercel-provided target.
3. TLS certificates are issued and renewed automatically by Vercel once the records validate.

## Moving the domain to a new host

When you move off Vercel (see [Deployment](deployment.md)), repoint DNS:

1. Stand up the app on the new host first and confirm it works on the host's temporary URL. Do not move DNS before the app is live and tested on the new host.
2. In the new host's dashboard, add the custom domain `highschoolbbqleague.com` (and `www`). The host shows the record values it needs.
3. Log in to the DNS host for HighSchoolBBQLeague.com.
4. Update the records to the new target:
   - Apex `A` record to the new host's IP (or `ALIAS`/`CNAME` flattening if provided).
   - `www` `CNAME` to the new host's target.
5. Wait for propagation. Lower the record TTL to 300 seconds a day before the cutover so changes take effect within minutes instead of hours.
6. Confirm TLS: the new host should issue a certificate once it sees the records. The site must serve over `https://`.
7. Verify with:
   ```bash
   dig highschoolbbqleague.com +short
   dig www.highschoolbbqleague.com +short
   curl -I https://highschoolbbqleague.com
   ```

## Apex vs www

Pick one canonical hostname and redirect the other so links, OpenGraph, and Clerk origins are consistent.

- If the canonical is the apex `highschoolbbqleague.com`, redirect `www` to it.
- Most hosts offer this redirect in their domain settings. Set it once.

Whichever you choose, set `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` to that exact canonical URL (see [Deployment](deployment.md)).

## After any DNS change, update these

1. **Clerk**: production instance allowed origin must match the live domain, or sign-in breaks.
2. **Stripe**: the webhook endpoint URL must point at the live domain (`/api/webhooks/stripe`).
3. **App env vars**: `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` must equal the canonical domain so QR codes and share links resolve correctly.

## Email and other records

!!! note "Email is separate from the app"
    If HighSchoolBBQLeague.com also handles email (MX records) or has SPF/DKIM/DMARC records, do not delete those when repointing the website. Change only the `A` / `CNAME` records for the web app. Leave `MX`, `TXT` (SPF/DKIM/DMARC), and any verification records intact unless you are deliberately migrating email too.

## A future option: Cloudflare in front

The [roadmap](../roadmap.md) includes putting Cloudflare in front of the app (Phase 1 hardening). If adopted, Cloudflare becomes the DNS host and proxy: you would point the domain's nameservers at Cloudflare, manage records there, and get DDoS protection and caching. That is a later phase, not required for go-live.
