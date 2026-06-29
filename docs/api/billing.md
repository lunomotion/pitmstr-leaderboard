# API: billing

The billing API group contains a single endpoint that starts a Stripe Checkout Session for an invoice. The companion webhook that completes the payment lives under a different group: see [API: webhooks](webhooks.md) and the [Billing & Stripe](../subsystems/billing-stripe.md) subsystem page.

## POST /api/billing/checkout

Creates a Stripe Checkout Session for an invoice and returns the hosted payment URL. Source: `src/app/api/billing/checkout/route.ts`.

### Auth

None. This endpoint is intentionally public so a payer can complete checkout from `/pay/[invoiceId]` without logging in. Access control is by possession of the invoice link.

### Request

`Content-Type: application/json`

```json
{ "invoiceId": "rec0123456789ABCD" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `invoiceId` | string | yes | Airtable invoice record id |

### Behavior

1. Validates `invoiceId` is present, else `400`.
2. `getInvoice(invoiceId)`; `404` if not found.
3. `400` if `paymentStatus === "Paid"` (prevents double payment).
4. Resolves the return-URL origin from `request.nextUrl.origin`, then `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, finally `https://highschoolbbqleague.com`.
5. Creates a Stripe Checkout Session:
   - `mode: "payment"`, `payment_method_types: ["card"]`
   - `customer_email: invoice.billingEmail || undefined`
   - one dynamic `price_data` line item: `currency: "usd"`, `unit_amount: Math.round(invoice.totalAmount * 100)`, product name `NHSBBQA Charter` then an em-dash separator then `{charterName}`, description `Invoice {invoiceNumber}`
   - `metadata: { invoiceId, invoiceNumber }` (the webhook reads `invoiceId` from here)
   - `success_url: {origin}/pay/{id}?success=1`, `cancel_url: {origin}/pay/{id}?canceled=1`
6. Flips the invoice to `Pending` via `updateInvoice`, wrapped in a non-fatal `try/catch`.
7. Returns the session URL.

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ "success": true, "url": "https://checkout.stripe.com/..." }` | Session created |
| `400` | `{ "success": false, "error": "Missing invoiceId" }` | No `invoiceId` |
| `400` | `{ "success": false, "error": "Invoice already paid" }` | Already paid |
| `404` | `{ "success": false, "error": "Invoice not found" }` | Unknown invoice |
| `500` | `{ "success": false, "error": "Stripe did not return a checkout URL" }` | Session had no `url` |
| `500` | `{ "success": false, "error": "<message>" }` | Unhandled error (e.g. Stripe API failure) |

### Example

```bash
curl -X POST https://highschoolbbqleague.com/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"invoiceId":"rec0123456789ABCD"}'
```

```json
{ "success": true, "url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

The caller (`PayButton.tsx`) then redirects the browser with `window.location.href = json.url`.

### Required environment

| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe key used by `getStripe()` |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL` | Origin fallback for return URLs |

## Related pages

- [Billing & Stripe](../subsystems/billing-stripe.md) - full lifecycle including the webhook.
- [Invoicing & Payments](../features/billing.md) - user-facing flow.
- [API: webhooks](webhooks.md) - `POST /api/webhooks/stripe`, the payment-completion handler.
