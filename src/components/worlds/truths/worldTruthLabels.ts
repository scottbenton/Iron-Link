// "1-33" for a d100 range, or the single number when it is one.
export function formatTruthRange(
  range: { min: number; max: number } | null | undefined,
): string {
  if (!range) return "";
  return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
}
