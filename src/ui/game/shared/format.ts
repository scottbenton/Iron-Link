/** Real minus sign, so negative numbers line up with positive ones. */
const MINUS = "−";

/** A stat or meter value with its sign: "+3", "0", "−2". */
export function formatSigned(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${MINUS}${Math.abs(value)}`;
  return "0";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The text with its first letter capitalised, for names that come in lower
 * case (a stat's key, "edge") and go into a label ("Roll +Edge").
 */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
