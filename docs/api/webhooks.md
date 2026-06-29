# API: webhooks

Two inbound webhook receivers. Neither uses the standard auth guards or the `{ success, data }` envelope. Each verifies a provider signature instead, and returns provider-shaped responses. Both are `POST` only.

Source files:

- `src/app/api/webhooks/clerk/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

---

## `POST /api/webhooks/clerk`

Receives Clerk user lifecycle events and mirrors them into the Airtable `Users` table.

| | |
|---|---|
| **Auth** | svix signature verification (not a Clerk session) |
| **Secret** | `CLERK_WEBHOOK_SECRET` |

### Signature verification

1. If `CLERK_WEBHOOK_SECRET` is unset, responds `500` ("Webhook secret not configured").
2. Reads the `svix-id`, `svix-timestamp`, and `svix-signature` headers. If any is missing, responds `400` ("Missing svix headers").
3. Constructs a `svix` `Webhook` with the secret and calls `wh.verify(body, headers)`. On failure, responds `400` ("Invalid signature").

The raw JSON body is re-stringified before verification so the signed payload matches.

### Events handled

| Clerk event | Airtable action |
|---|---|
| `user.created` | `createUser(id, email, firstName, lastName)` -> inserts a `Users` row with `Status = "pending"` and `Created At = now`. |
| `user.updated` | `updateUser(id, { email, firstName, lastName })` -> updates the matching `Users` row (found by Clerk ID). |
| `user.deleted` | `suspendUser(id)` -> sets `Status = "suspended"` on the matching row. |

Email is taken from `email_addresses[0]`. Any other event type is ignored.

### Response

Plain text `"OK"` with status `200` after handling (or no-op).

### Side effects

- Creates, updates, or suspends a row in the Airtable `Users` table.

!!! warning "Verify: writes are best-effort and never reported back"
    `updateUser` and `suspendUser` find their target by Clerk ID and silently return if no row matches; all three writers swallow Airtable errors. The webhook still returns `200 OK` regardless. A failed mirror will not surface here, only in server logs. Also note this route reads `CLERK_WEBHOOK_SECRET`, while other Clerk usage reads `CLERK_SECRET_KEY`; both must be configured.

---

## `POST /api/webhooks/stripe`

Receives Stripe events and marks invoices paid. Runs on the Node.js runtime (`export const runtime = "nodejs"`).

| | |
|---|---|
| **Auth** | Stripe signature verification |
| **Secret** | `STRIPE_WEBHOOK_SECRET` |

### Signature verification

1. Reads the `stripe-signature` header. If the header or `STRIPE_WEBHOOK_SECRET` is missing, responds `400` ("Missing signature or webhook secret").
2. Reads the raw request body with `request.text()` (required for signature checking; the body must not be pre-parsed).
3. Calls `stripe.webhooks.constructEvent(rawBody, signature, secret)`. On failure, responds `400` with the error message.

### Events handled

| Stripe event | Action |
|---|---|
| `checkout.session.completed` | If `session.metadata.invoiceId` is present and `session.payment_status === "paid"`, calls `updateInvoice(invoiceId, { paymentStatus: "Paid", paidAt: now, paymentMethod: "Credit Card" })`. |

The `invoiceId` is read from the Checkout Session metadata, which is set when the session is created by `/api/billing/checkout` (documented separately). Any other event type is acknowledged but ignored.

### Response

```json
{ "received": true }
```

Status `200` on success. Returns `500` `{ "error": "Handler failed" }` if the handler throws after verification.

### Side effects

- Updates the matching `Invoices` row to `Payment Status = "Paid"`, sets `Paid At`, and forces `Payment Method = "Credit Card"`.

!!! note "Idempotency"
    There is no explicit idempotency guard. A repeated `checkout.session.completed` for the same invoice simply re-applies the same paid fields, which is safe but not deduplicated. The match relies entirely on `metadata.invoiceId` being set on the session.
