# Subsystems

These pages are deep dives into the core engines that power PITMSTR. Where the [Features](../features/index.md) section explains what users do, this section explains how the underlying machinery works, with the real code.

## In this section

- **[Scoring Engine](scoring-engine.md)** - the MEAT scoring algorithm in `src/lib/scoring.ts`: the input scale, drop-lowest averaging, component weighting, ranking, and tie-breaks, with a fully worked example and the known scale and wiring issues.
- **[Billing & Stripe](billing-stripe.md)** - the Stripe checkout session lifecycle, the webhook handler, and the invoice state machine (Unpaid, Pending, Paid, Refunded).
- **[PDF & Report Generation](pdf-reports.md)** - how `src/lib/pdf` renders documents with `@react-pdf/renderer`: the shared components, styling, and each document template.
- **[QR Check-in & Turn-in](qr-flows.md)** - QR code generation in `src/lib/qr.ts` and the scan-based check-in and judge turn-in flows.

!!! tip "Read order"
    If you are new to the codebase, read [Architecture](../architecture/index.md) and the [Data Model](../data-model/index.md) first. The subsystems below assume you understand the Airtable tables and the request flow.
