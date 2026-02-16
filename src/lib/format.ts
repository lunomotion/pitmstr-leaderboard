/**
 * Format a state abbreviation in NHSBBQA brand style.
 * "TX" → "TX HSBBQ"
 */
export function formatStateHSBBQ(state: string | undefined | null): string {
  if (!state) return "";
  return `${state} HSBBQ`;
}
