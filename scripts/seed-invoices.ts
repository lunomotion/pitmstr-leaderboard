/**
 * Seed Demo Invoices
 *
 * Creates a handful of demo invoices across existing charters/schools with
 * a mix of payment statuses, methods, and payer types. Useful for populating
 * the billing dashboard for demos.
 *
 * Usage:
 *   npx tsx scripts/seed-invoices.ts
 *
 * Requires AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env.local
 */

import Airtable from "airtable";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local");
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

const CHARTER_FEE = 250;

// Spread invoices across the last 8 months for nice chart data
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

interface DemoInvoice {
  billingContact: string;
  billingEmail: string;
  billingPhone: string;
  payerType: string;
  aeuType: string;
  paymentMethod: string;
  paymentStatus: "Paid" | "Unpaid" | "Pending" | "Refunded";
  teamCount: number;
  taxExempt: boolean;
  taxExemptNumber?: string;
  notes: string;
  createdDaysAgo: number;
  paidDaysAgo?: number;
}

const DEMO_INVOICES: DemoInvoice[] = [
  {
    billingContact: "Sarah Mitchell",
    billingEmail: "smitchell@austinisd.org",
    billingPhone: "(512) 555-0142",
    payerType: "Teacher",
    aeuType: "Independent School District",
    paymentMethod: "Purchase Order",
    paymentStatus: "Paid",
    teamCount: 3,
    taxExempt: true,
    taxExemptNumber: "TX-EX-84521",
    notes: "Annual charter payment for 2026 season",
    createdDaysAgo: 45,
    paidDaysAgo: 30,
  },
  {
    billingContact: "James Rodriguez",
    billingEmail: "jrodriguez@dallashs.edu",
    billingPhone: "(214) 555-0198",
    payerType: "CTE Director",
    aeuType: "School District",
    paymentMethod: "Check",
    paymentStatus: "Paid",
    teamCount: 2,
    taxExempt: false,
    notes: "Check #4821 received",
    createdDaysAgo: 60,
    paidDaysAgo: 52,
  },
  {
    billingContact: "Linda Kowalski",
    billingEmail: "lkowalski@charlotteschools.nc.gov",
    billingPhone: "(704) 555-0167",
    payerType: "Office Admin",
    aeuType: "Charter System",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    teamCount: 4,
    taxExempt: true,
    taxExemptNumber: "NC-EX-77231",
    notes: "Paid via Stripe",
    createdDaysAgo: 75,
    paidDaysAgo: 73,
  },
  {
    billingContact: "Marcus Thompson",
    billingEmail: "mthompson@memphiscs.edu",
    billingPhone: "(901) 555-0134",
    payerType: "Teacher",
    aeuType: "Independent School District",
    paymentMethod: "Purchase Order",
    paymentStatus: "Pending",
    teamCount: 2,
    taxExempt: true,
    taxExemptNumber: "TN-EX-65432",
    notes: "Awaiting district approval on PO",
    createdDaysAgo: 12,
  },
  {
    billingContact: "Jennifer Walsh",
    billingEmail: "jwalsh@atlpublic.ga.edu",
    billingPhone: "(404) 555-0189",
    payerType: "CTE Director",
    aeuType: "School District",
    paymentMethod: "Check",
    paymentStatus: "Unpaid",
    teamCount: 3,
    taxExempt: true,
    taxExemptNumber: "GA-EX-55667",
    notes: "First reminder sent",
    createdDaysAgo: 20,
  },
  {
    billingContact: "Robert Chen",
    billingEmail: "rchen@kcmoschools.org",
    billingPhone: "(816) 555-0123",
    payerType: "Teacher",
    aeuType: "Independent School District",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    teamCount: 1,
    taxExempt: false,
    notes: "Single team charter",
    createdDaysAgo: 90,
    paidDaysAgo: 88,
  },
  {
    billingContact: "Maria Gonzales",
    billingEmail: "mgonzales@houstonisd.org",
    billingPhone: "(713) 555-0156",
    payerType: "Parent",
    aeuType: "Independent School District",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    teamCount: 1,
    taxExempt: false,
    notes: "Parent-paid charter for student team",
    createdDaysAgo: 110,
    paidDaysAgo: 108,
  },
  {
    billingContact: "David Harper",
    billingEmail: "dharper@wichitaschools.ks.gov",
    billingPhone: "(316) 555-0178",
    payerType: "Office Admin",
    aeuType: "Unified School District",
    paymentMethod: "Check",
    paymentStatus: "Unpaid",
    teamCount: 2,
    taxExempt: true,
    taxExemptNumber: "KS-EX-33221",
    notes: "",
    createdDaysAgo: 7,
  },
  {
    billingContact: "Ashley Brooks",
    billingEmail: "abrooks@columbiacs.sc.edu",
    billingPhone: "(803) 555-0145",
    payerType: "Sponsor",
    aeuType: "School District",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    teamCount: 5,
    taxExempt: false,
    notes: "Sponsored by local BBQ restaurant",
    createdDaysAgo: 150,
    paidDaysAgo: 148,
  },
  {
    billingContact: "Tommy Jackson",
    billingEmail: "tjackson@bhamschools.al.gov",
    billingPhone: "(205) 555-0162",
    payerType: "CTE Director",
    aeuType: "County",
    paymentMethod: "Purchase Order",
    paymentStatus: "Pending",
    teamCount: 2,
    taxExempt: true,
    taxExemptNumber: "AL-EX-99881",
    notes: "PO #AL-2026-4412 submitted",
    createdDaysAgo: 4,
  },
];

async function fetchCharters(): Promise<{ id: string; name: string }[]> {
  console.log("Fetching existing charters...");
  const records = await base("Charter").select({ maxRecords: 100 }).all();
  return records.map((r) => ({
    id: r.id,
    name: (r.get("Charter Name") as string) || "Unknown",
  }));
}

async function clearExistingInvoices(): Promise<void> {
  console.log("Clearing existing invoices...");
  const records = await base("Invoices").select({ maxRecords: 100 }).all();
  if (records.length === 0) {
    console.log("  (none to clear)");
    return;
  }
  const ids = records.map((r) => r.id);
  // Airtable delete supports max 10 at a time
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    await base("Invoices").destroy(batch);
  }
  console.log(`  Deleted ${ids.length} existing invoices`);
}

async function seedInvoices() {
  const charters = await fetchCharters();
  if (charters.length === 0) {
    console.error("No charters found. Run `npm run seed` first to create schools.");
    process.exit(1);
  }
  console.log(`Found ${charters.length} charters`);

  await clearExistingInvoices();

  console.log(`Creating ${DEMO_INVOICES.length} demo invoices...`);

  for (let i = 0; i < DEMO_INVOICES.length; i++) {
    const demo = DEMO_INVOICES[i];
    const charter = charters[i % charters.length];

    // Only include fields that exist in the Airtable Invoices table
    const fields: Partial<Airtable.FieldSet> = {
      Charter: [charter.id],
      "Billing Contact": demo.billingContact,
      "Billing Email": demo.billingEmail,
      "Billing Phone": demo.billingPhone,
      "Payer Type": demo.payerType,
      "AEU Type": demo.aeuType,
      "Payment Method": demo.paymentMethod,
      "Payment Status": demo.paymentStatus,
      "Total Amount": demo.teamCount * CHARTER_FEE,
      Notes: demo.notes,
    };

    try {
      const record = await base("Invoices").create(fields);
      console.log(
        `  ✓ ${charter.name} — ${demo.paymentStatus} — $${
          demo.teamCount * CHARTER_FEE
        } (${record.id})`
      );
    } catch (err) {
      console.error(`  ✗ Failed: ${charter.name} — ${err}`);
    }
  }

  console.log("\nDone. Check /admin/billing in the portal.");
}

seedInvoices().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
