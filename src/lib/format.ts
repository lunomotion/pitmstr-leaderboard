/**
 * Format a state abbreviation in NHSBBQA brand style.
 * "TX" → "TX HSBBQ"
 */
export function formatStateHSBBQ(state: string | undefined | null): string {
  if (!state) return "";
  return `${state} HSBBQ`;
}

/**
 * State abbreviation to full name mapping.
 */
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};

/**
 * Format state for official PDF branding.
 * "TX" → "Texas High School BBQ Association (TXHSBBQ)"
 */
export function formatStateAssociation(state: string | undefined | null): string {
  if (!state) return "";
  const fullName = STATE_NAMES[state.toUpperCase()] || state;
  return `${fullName} High School BBQ Association (${state.toUpperCase()}HSBBQ)`;
}
