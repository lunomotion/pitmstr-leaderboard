# Compliance & Waivers

This page covers liability waivers, handbook agreements, and required sign-offs in the registration and competition flow.

!!! warning "Verify: digital waivers and handbook agreements are not implemented in code"
    As of this writing there is no waiver-signing, handbook-acceptance, or e-signature feature in the application. A full-text search of `src` for `waiver`, `handbook`, `liability`, `consent`, `agreement`, and `sign-off` finds only: FAQ copy in `src/app/knowledge-base/page.tsx`, and document-type labels in `src/lib/types.ts`. No route collects or stores a signed waiver, and no Airtable field tracks acceptance per user, team, or student. Treat any expectation of an in-app waiver flow as a future requirement, not an existing feature.

## What exists today

### Knowledge base FAQ (informational only)

`src/app/knowledge-base/page.tsx` answers compliance-adjacent questions as static content:

- **"Who holds liability and who supervises students?"** (FAQ id `faq-liability`)
- **"Do you require waivers or background checks?"** (FAQ id `faq-waivers`) which states that "Districts and venues determine waivers and volunteer screening under local policy."

In other words, the platform's stated position is that waivers and volunteer screening are handled offline under each district's and venue's own policy, not collected by PITMSTR.

### Vendor documents (organization-level compliance)

The closest thing to formal compliance artifacts is the **Vendor Documents** feature, which is about the organization's standing with school finance departments, not individual student waivers. Defined in `src/lib/types.ts` (`VENDOR_DOC_TYPES`) and surfaced at `/admin/billing/documents`:

| Document | Purpose |
|---|---|
| W-9 | Federal tax form required by school finance departments |
| ACH Authorization | Bank payment authorization form |
| Certificate of Insurance | Proof of business liability insurance |
| Sole Source Justification | Justifies NHSBBQA as the sole provider |
| Procurement Form | Vendor procurement documentation |
| District Adoption Agreement | District-level program adoption agreement |

These are uploaded once in Airtable and bundled into the "payment package" ZIP attached to invoices. See [Invoicing and Payments](billing.md). The **Certificate of Insurance** and **District Adoption Agreement** are the items most related to liability and program approval, but they are organizational documents, not per-participant sign-offs.

### FERPA posture

The project operates under a stated FERPA requirement (student data must be protected; see the project `CLAUDE.md`). In practice this is a constraint on how student records in the Airtable **Students** table are accessed, not a feature:

- Student data is only reachable through API routes, never directly from the browser.
- Admin student views require the admin role.
- Students and parents only see their own linked team via the self-link flow.

!!! warning "Verify: FERPA controls are conventions, not enforced data scoping"
    FERPA protection here relies on role gating at the route level and on Airtable access being server-only. There is no per-record ownership check that, for example, prevents one student account from requesting another team's `GET /api/teams/[teamId]`. Before relying on FERPA compliance for an audit, review whether student-detail endpoints enforce that the caller is entitled to that specific student or team.

## If you need to build real waivers

A minimal future design (not present today) would likely add:

1. An Airtable table (for example `Waivers` or fields on `Students`) capturing waiver type, signer, timestamp, and IP.
2. A signing step in the registration or team-link flow that records acceptance before a student is marked competition-eligible.
3. Optionally an e-signature provider integration.

Until that exists, document and handle waivers offline per district policy, consistent with the knowledge-base FAQ.
