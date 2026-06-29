# API: reports

Every endpoint in this group renders a document server-side and streams it back. All are `GET`, all require an authenticated admin (`requirePermission("admin:access")`), and all set `Cache-Control: no-store`. Four return `application/pdf`; one returns `application/zip`. See [Reports & Certificates](../features/reports.md) for who triggers each, and [PDF & Report Generation](../subsystems/pdf-reports.md) for template internals.

## Auth (shared)

Each route starts with:

```ts
const auth = await requirePermission("admin:access");
if (isAuthError(auth)) return auth;
```

That guard returns `401 { "error": "Unauthorized" }` if not signed in, or `403 { "error": "Forbidden" }` if the role lacks `admin:access`. The tables below omit these to avoid repetition.

## GET /api/reports/invoice

Single-page charter invoice PDF. Source: `src/app/api/reports/invoice/route.ts`.

| Param | In | Required | Notes |
|---|---|---|---|
| `invoiceId` | query | yes | Airtable invoice record id |

Loads the invoice, resolves charter via `getSchool`, builds per-team line items (`searchTeams` filtered by `charterId`, each at `CHARTER_FEE`), and renders `InvoicePDF`.

| Status | Result |
|---|---|
| `200` | `application/pdf`, `Content-Disposition: attachment; filename="NHSBBQA-Invoice-{invoiceNumber}.pdf"` |
| `400` | `{ success: false, error: "invoiceId is required" }` |
| `404` | `{ success: false, error: "Invoice not found" }` |
| `500` | `{ success: false, error: "Failed to generate invoice PDF" }` |

## GET /api/reports/payment-package

ZIP containing the invoice PDF plus all active vendor documents. Source: `src/app/api/reports/payment-package/route.ts`.

| Param | In | Required | Notes |
|---|---|---|---|
| `invoiceId` | query | yes | Airtable invoice record id |

Renders `InvoicePDF`, fetches vendor docs (`getVendorDocuments`), downloads each `fileUrl`, and assembles a ZIP with JSZip. Entries are numbered `1-Invoice-...pdf`, `2-{type}.{ext}`, etc. Vendor docs that fail to download are skipped.

| Status | Result |
|---|---|
| `200` | `application/zip`, `Content-Disposition: attachment; filename="NHSBBQA-PaymentPackage-{invoiceNumber}.zip"` |
| `400` | `{ success: false, error: "invoiceId is required" }` |
| `404` | `{ success: false, error: "Invoice not found" }` |
| `500` | `{ success: false, error: "Failed to generate payment package" }` |

## GET /api/reports/event-results

Multi-page event results PDF with MEAT breakdown. Source: `src/app/api/reports/event-results/route.ts`.

| Param | In | Required | Default | Notes |
|---|---|---|---|---|
| `eventId` | query | yes | - | Airtable event record id |
| `teamsPerPage` | query | no | `10` | Must be 5, 10, or 25; invalid values fall back to 10 |
| `topN` | query | no | `0` | Only the top N teams; `0` = all |

Loads the event, the overall leaderboard (`getEventLeaderboard`), and MEAT component averages from the Turn-Ins table, then renders `EventReport`.

| Status | Result |
|---|---|
| `200` | `application/pdf`, `Content-Disposition: inline; filename="Event_Report_{eventName}.pdf"` |
| `400` | `{ success: false, error: "eventId is required" }` |
| `404` | `{ success: false, error: "Event not found: {eventId}" }` |
| `500` | `{ success: false, error: "Failed to generate event report PDF" }` |

## GET /api/reports/qr-sheet

QR turn-in sheet PDF for one team at one event. Source: `src/app/api/reports/qr-sheet/route.ts`.

| Param | In | Required | Notes |
|---|---|---|---|
| `teamId` | query | yes | Airtable team record id |
| `eventId` | query | yes | Airtable event record id |

Loads team + event, resolves the district (`getSchool`), generates codes with `generateTeamQRSheet` (categories minus "Overall"), and renders `QRTurnInSheet`.

| Status | Result |
|---|---|
| `200` | `application/pdf`, `Content-Disposition: inline; filename="QR_Sheet_{team}_{event}.pdf"` |
| `400` | `{ success: false, error: "teamId and eventId are required" }` |
| `404` | `{ success: false, error: "Team not found: {teamId}" }` or `"Event not found: {eventId}"` |
| `500` | `{ success: false, error: "Failed to generate QR sheet PDF" }` |

## GET /api/reports/qr-sheet-batch

Single multi-page PDF, one QR turn-in sheet per team registered at the event. Source: `src/app/api/reports/qr-sheet-batch/route.ts`.

| Param | In | Required | Notes |
|---|---|---|---|
| `eventId` | query | yes | Airtable event record id |

Reads the event's linked `Teams`, builds a sheet for each, and renders the inline `BatchQRSheet` document.

| Status | Result |
|---|---|
| `200` | `application/pdf`, `Content-Disposition: inline; filename="QR_Sheets_All_Teams_{event}.pdf"` |
| `400` | `{ success: false, error: "eventId is required" }` |
| `404` | `{ success: false, error: "Event not found: {eventId}" }` or `"No teams registered for this event"` |
| `500` | `{ success: false, error: "Failed to generate batch QR sheets" }` |

## Related pages

- [Reports & Certificates](../features/reports.md) - feature overview and triggers.
- [PDF & Report Generation](../subsystems/pdf-reports.md) - template details.
- [QR Check-in & Turn-in](../subsystems/qr-flows.md) - QR generation and scan flows.
