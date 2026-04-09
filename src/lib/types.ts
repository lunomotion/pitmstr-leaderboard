// Division types - matches Airtable Divisions table
export type Division = "HSBBQ" | "MSBBQ" | string;

// Category types for scoring - matches Airtable Categories table
// Core categories that are common
export type Category =
  | "Overall"
  | "Brisket"
  | "Pork"
  | "Pork Butt"
  | "Chicken"
  | "Chicken Drum Lollipops"
  | "Ribeye"
  | "St. Louis Ribs"
  | "Chili"
  | "Grilled Cheese"
  | "Dutch Oven Dessert"
  | string; // Allow dynamic categories from Airtable

// Event status
export type EventStatus = "upcoming" | "live" | "completed" | "cancelled";

// Base Airtable record type
export interface AirtableRecord {
  id: string;
  createdTime: string;
}

// Event from Airtable
export interface Event extends AirtableRecord {
  name: string;
  date: string;
  location: string;
  city: string;
  state: string;
  division: Division;
  status: EventStatus;
  description?: string;
  hostSchool?: string;
  registeredTeams?: number;
  maxTeams?: number;
  categories: Category[];
  imageUrl?: string;
}

// School (Charter) from Airtable
export interface School extends AirtableRecord {
  name: string;
  city: string;
  state: string;
  district?: string; // County in Airtable
  logoUrl?: string;
  teams?: string[]; // Team record IDs
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Team from Airtable
export interface Team extends AirtableRecord {
  name: string;
  schoolId: string;
  schoolName?: string; // Lookup field
  division: Division;
  captain?: string;
  coach?: string;
  members?: TeamMember[];
  logoUrl?: string;
  state?: string;
}

// Team member (Student) from Airtable
export interface TeamMember extends AirtableRecord {
  name: string;
  teamId: string;
  role?: string; // Pitmaster, etc.
  photoUrl?: string;
  email?: string;
  phone?: string;
  shirtSize?: string;
  allergies?: string;
  teamName?: string;
  schoolName?: string;
}

// Score entry for a team at an event
export interface Score extends AirtableRecord {
  eventId: string;
  teamId: string;
  teamName?: string; // Lookup
  schoolName?: string; // Lookup
  category: Category;
  score: number;
  rank?: number;
  judgingNotes?: string;
}

// Aggregated leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  schoolName: string;
  schoolId: string;
  state: string;
  division: Division;
  score: number;
  categoryScores: {
    [key in Category]?: {
      score: number;
      rank: number;
    };
  };
  previousRank?: number;
  change?: "up" | "down" | "same" | "new";
}

// Event with leaderboard data
export interface EventWithLeaderboard extends Event {
  leaderboard: LeaderboardEntry[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    offset: string | null;
    hasMore: boolean;
  };
}

// Filter options for leaderboard
export interface LeaderboardFilters {
  division?: Division;
  category?: Category;
  state?: string;
  searchQuery?: string;
}

// Event list filters
export interface EventFilters {
  division?: Division;
  status?: EventStatus;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
}

// State association
export interface StateAssociation {
  code: string;
  name: string;
  fullName: string; // e.g., "Texas HSBBQ Association"
  abbreviation: string; // e.g., "TXHSBBQ"
  logoUrl?: string;
}

// Awards/achievements
export interface Award {
  id: string;
  teamId: string;
  eventId: string;
  title: string;
  category?: Category;
  placement: number; // 1, 2, 3 for podium
  eventName: string;
  eventDate: string;
}

// Invoice types
export type PayerType = "Teacher" | "Office Admin" | "CTE Director" | "Parent" | "Sponsor" | "In-Kind Donor";
export type PaymentMethod = "Check" | "Credit Card" | "Purchase Order";
export type PaymentStatus = "Unpaid" | "Pending" | "Paid" | "Refunded";
export type AEUType =
  | "School District"
  | "County"
  | "Independent School District"
  | "Parish System"
  | "Charter System"
  | "Local Education Agency"
  | "Faith Based Entity"
  | "Regional School Unit"
  | "Supervisory Union"
  | "Education Service Center"
  | "Unified School District";

export interface Invoice extends AirtableRecord {
  invoiceNumber: string;
  charterId: string;
  charterName?: string;
  billingContact: string;
  billingEmail: string;
  billingPhone: string;
  payerType: PayerType;
  aeuType: AEUType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  taxExempt: boolean;
  taxExemptNumber: string;
  paidAt: string | null;
  notes: string;
  state?: string;
  teamCount?: number;
}

export const PAYER_TYPES: PayerType[] = [
  "Teacher",
  "Office Admin",
  "CTE Director",
  "Parent",
  "Sponsor",
  "In-Kind Donor",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Check",
  "Credit Card",
  "Purchase Order",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Unpaid",
  "Pending",
  "Paid",
  "Refunded",
];

export const AEU_TYPES: AEUType[] = [
  "School District",
  "County",
  "Independent School District",
  "Parish System",
  "Charter System",
  "Local Education Agency",
  "Faith Based Entity",
  "Regional School Unit",
  "Supervisory Union",
  "Education Service Center",
  "Unified School District",
];

export const CHARTER_FEE = 250; // $250 per team charter

// Vendor Documents — supporting docs schools need for payment processing
export type VendorDocType =
  | "W-9"
  | "ACH"
  | "Insurance"
  | "Sole Source"
  | "Procurement"
  | "District Adoption";

export interface VendorDocument extends AirtableRecord {
  type: VendorDocType;
  fileName: string;
  fileUrl: string;
  active: boolean;
}

export const VENDOR_DOC_TYPES: { type: VendorDocType; label: string; description: string }[] = [
  { type: "W-9", label: "W-9", description: "Federal tax form required by school finance departments" },
  { type: "ACH", label: "ACH Authorization", description: "Bank payment authorization form" },
  { type: "Insurance", label: "Certificate of Insurance", description: "Proof of business liability insurance" },
  { type: "Sole Source", label: "Sole Source Justification", description: "Justifies NHSBBQA as the sole provider" },
  { type: "Procurement", label: "Procurement Form", description: "Vendor procurement documentation" },
  { type: "District Adoption", label: "District Adoption Agreement", description: "District-level program adoption agreement" },
];

// Constants - Default categories (actual list comes from Airtable)
export const CATEGORIES: Category[] = [
  "Overall",
  "Brisket",
  "Pork",
  "Pork Butt",
  "Chicken",
  "Chicken Drum Lollipops",
  "Ribeye",
  "St. Louis Ribs",
  "Chili",
  "Grilled Cheese",
  "Dutch Oven Dessert",
];

export const DIVISIONS: { value: Division; label: string; description: string; code: string; gradeRange: string; ageRange: string }[] = [
  {
    value: "KIDSQ Division",
    label: "KIDSQ Division",
    code: "KIDSQ",
    gradeRange: "K-4",
    ageRange: "5-11",
    description: "Elementary level introduction to competitive barbecue.",
  },
  {
    value: "MSBBQ Division",
    label: "MSBBQ Division",
    code: "MSBBQ",
    gradeRange: "K5-8",
    ageRange: "11-13",
    description: "Middle School Barbecue Competition Division.",
  },
  {
    value: "HSBBQ Division",
    label: "HSBBQ Division",
    code: "HSBBQ",
    gradeRange: "K9-12",
    ageRange: "14-18",
    description: "High School Barbecue Competition Division (primary league).",
  },
  {
    value: "HSBBQ Unified Division",
    label: "HSBBQ Unified Division",
    code: "HSBBQU",
    gradeRange: "K5-12",
    ageRange: "11-18",
    description: "Inclusive competition division pairing students with adaptive support.",
  },
  {
    value: "CBBQ Division",
    label: "CBBQ Division",
    code: "CBBQ",
    gradeRange: "K13-20",
    ageRange: "",
    description: "College and university teams.",
  },
  {
    value: "OBBQ Division",
    label: "OBBQ Division",
    code: "OBBQ",
    gradeRange: "",
    ageRange: "Anyone",
    description: "Open competition for alumni, community teams, and development events.",
  },
  // Inactive — kept for future reactivation. Not in Airtable currently.
  {
    value: "Mentor BBQ",
    label: "Mentor BBQ",
    code: "MENTOR",
    gradeRange: "",
    ageRange: "Students/Adults",
    description: "Mentor BBQ Division (Students/Adults)",
  },
];

export const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: "live", label: "Live Now" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// US States for filtering
export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];
