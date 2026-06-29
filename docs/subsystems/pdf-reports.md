# PDF & Report Generation

All PDFs in PITMSTR are generated server-side with [`@react-pdf/renderer`](https://react-pdf.org/). Templates are React component trees built from the library's primitives (`Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet`). API routes turn a template into a binary buffer with `renderToBuffer(...)` and stream it back as `application/pdf`.

There is no browser, no headless Chrome, and no Puppeteer involved. Rendering happens inside the serverless function, which makes it deployable on Vercel.

## Where the templates live

| Template | File | Document type |
|---|---|---|
| `InvoicePDF` | `src/lib/pdf/invoice.tsx` | Single-page charter invoice |
| `EventReport` | `src/lib/pdf/event-report.tsx` | Multi-page event results with MEAT breakdown |
| `QRTurnInSheet` | `src/lib/pdf/qr-turn-in-sheet.tsx` | One-page QR turn-in label sheet for one team |
| `BatchQRSheet` | inline in `src/app/api/reports/qr-sheet-batch/route.ts` | Multi-page QR sheet, one page per team |

The first three are reusable components exported from `src/lib/pdf/`. The fourth (`BatchQRSheet`) is defined inside its route handler and is written with `React.createElement(...)` calls instead of JSX, because the route file is a `.ts` file rather than `.tsx`. It duplicates the `QRTurnInSheet` layout.

## Rendering pattern

Every reports route follows the same shape:

```ts
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

const pdfBuffer = await renderToBuffer(
  React.createElement(InvoicePDF, { invoice, charterName, charterState, teamLines }) as any
);

return new NextResponse(new Uint8Array(pdfBuffer), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  },
});
```

Notes that apply across the board:

- The element is cast `as any` to bridge a React 19 / `@react-pdf/renderer` type mismatch (the `eslint-disable` comment above each call documents this).
- The buffer is wrapped in `new Uint8Array(...)` before being handed to `NextResponse`.
- `Cache-Control: no-store` is set on all PDFs so financial and results data is never cached.
- `Content-Disposition` is either `attachment` (invoice, payment package) or `inline` (event results, QR sheets) depending on whether the file is meant to download or preview in-tab.

## Shared styling conventions

There is no shared stylesheet module; each template calls `StyleSheet.create({...})` locally. They nonetheless share consistent conventions:

- **Font:** `Helvetica` for body text, `Helvetica-Bold` for emphasis. These are the built-in PDF standard fonts, so no font files are bundled.
- **Page size:** `LETTER` everywhere.
- **Brand colors:** a deep blue and BBQ red recur. The invoice uses `#2E3A87` (blue) as its primary accent. The event report defines a `colors` object:

```ts
const colors = {
  primary: "#C62828",   // bbq-red
  secondary: "#1e3a8a", // americana-blue
  gold: "#D4A017",
  silver: "#A0A0A0",
  bronze: "#CD7F32",
  // ...
};
```

- **State branding:** the event report and both QR sheets call `formatStateAssociation(state)` from `src/lib/format.ts` to render a header like `Texas High School BBQ Association (TXHSBBQA)` when a state abbreviation is present.
- **Logo:** the event report and QR sheets accept a `logoSrc` prop. Routes build it as `${baseUrl}/images/nhsbbqa-logo.png` where `baseUrl` is `NEXT_PUBLIC_APP_URL` (falling back to `http://localhost:3000`). The logo only renders if `logoSrc` is truthy.

## InvoicePDF (`invoice.tsx`)

A single `LETTER` page. Props:

```ts
interface InvoicePDFProps {
  invoice: Invoice;
  charterName: string;
  charterState: string;
  teamLines: InvoiceTeamLine[]; // { name, division, fee }
}
```

Layout, top to bottom:

- **Header** with the NHSBBQA org name, tagline, and an `INVOICE` title block showing `invoice.invoiceNumber` and a status badge. Badge color is computed from `paymentStatus`: green `#2E7D32` for `Paid`, orange `#F57C00` for `Pending`, red `#C62828` for `Refunded`, gray otherwise.
- **Bill To / Invoice Details** two-column block: charter name, billing contact/email/phone, state on the left; date issued, payer type, payment method, AEU type, and (if present) paid date on the right. Dates are formatted with `toLocaleDateString("en-US", { year, month: "long", day })`.
- **Tax-exempt badge** rendered only if `invoice.taxExempt` is true, showing `invoice.taxExemptNumber` or "Number on file".
- **Team line-item table** with columns Team / Division / Charter Fee, alternating row backgrounds. If `teamLines` is empty it falls back to a single "Charter Registration" row for the full `totalAmount`. A `Total Due` row closes the table.
- **Notes** block, rendered only if `invoice.notes` exists.
- **Footer** with the NHSBBQA trademark line.

## EventReport (`event-report.tsx`)

A multi-page results document. Props of note:

```ts
interface EventReportProps {
  eventName: string;
  eventDate: string;
  location: string;
  division: string;
  state?: string;
  teams: TeamEventScore[]; // already ranked
  teamsPerPage?: number;   // default 10
  topN?: number;           // 0 = all
  logoSrc?: string;
}
```

Structure:

1. **Overall standings pages.** `displayTeams` (optionally truncated to `topN`) are chunked into pages of `teamsPerPage` via a local `chunk()` helper. Each page repeats a `ReportHeader`. The first page also shows a stats strip (team count, category count, top score, max possible).
2. The overall table shows per-team aggregated MEAT components. `getComponentTotals()` sums each team's per-category `M/E/A/T` across categories. The total cell renders `eventTotal/maxPossible`.
3. **Per-category pages.** The component collects every unique category name across all teams, re-ranks teams within each category by `result.score` (with tie handling: equal scores share a rank), and emits a `CategoryStandingsTable` chunked the same way.
4. A `fixed` footer on every page prints the MEAT weighting legend (`M=10% E=50% A=20% T=20%`) and the generation date.

Rank coloring uses gold/silver/bronze for ranks 1/2/3 via `getRankColor()`.

!!! warning "Verify: MEAT weighting label mismatch"
    The event report footer and overall table headers label the weights `M=10% E=50% A=20% T=20%`. The judge scoring form (`/scan/turnin/...`) and `/api/scoring/submit` use point ranges `M=10, E=55, A=15, T=20` (out of 100). These are two different representations and they do not line up cleanly (50 percent vs 55 points, etc.). Confirm with the MEAT scoring packet which is authoritative before treating either label as correct. See [QR Check-in & Turn-in](qr-flows.md).

## QRTurnInSheet (`qr-turn-in-sheet.tsx`)

One `LETTER` page per team. Props: `teamName`, `schoolName`, `district`, `eventName`, `codes` (an array of `QRCodeData`), optional `state` and `logoSrc`.

Layout:

- Centered NHSBBQA logo (if provided), then the state association line (if `state` resolves).
- Header fields: `TEAM NAME`, `HIGH SCHOOL`, `SCHOOL DISTRICT`, and `Event:`.
- An all-caps instruction: `(REMOVE LABELS AND PLACE ON TURN-IN BOX FOR EACH FOOD CATEGORY)`.
- A flex-wrap grid of QR cells. Each cell is `23%` wide with a blue (`#4472C4`) label header above a `110x110` QR image. The label text is `code.label` (for example `CHECK-IN`, `BRISKET`).
- A copyright footer with the current year.

The `codes` array is produced by `generateTeamQRSheet()` in `src/lib/qr.ts`. See [QR Check-in & Turn-in](qr-flows.md) for how those codes are built.

## BatchQRSheet (inline in `qr-sheet-batch/route.ts`)

This is the multi-team version of `QRTurnInSheet`. It is not in `src/lib/pdf/`; it lives inside the route and is authored with `React.createElement` because the file is `.ts`. It renders one `Page` per team in a single `Document`, with the same logo / header / instruction / QR-grid layout, plus a per-page `Team N of M` footer counter. The styling object is copy-pasted from `QRTurnInSheet`.

!!! note "Duplication to be aware of"
    `BatchQRSheet` and `QRTurnInSheet` are independent copies of the same layout. A visual change to the single-team sheet must be made in both places to keep batch output consistent.

## Related pages

- [Reports & Certificates](../features/reports.md) - who generates each PDF and from where.
- [API: reports](../api/reports.md) - per-endpoint reference.
- [QR Check-in & Turn-in](qr-flows.md) - QR data that feeds the turn-in sheets.
