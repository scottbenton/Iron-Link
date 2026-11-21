/** Real minus sign, so negative numbers line up with positive ones. */
const MINUS = "−";

export interface FormatSignedOptions {
  /** Signs zero too: "+0". */
  signedZero?: boolean;
  /** A hyphen in place of the real minus sign: "-2". */
  asciiMinus?: boolean;
}

/**
 * A stat or meter value with its sign: "+3", "0", "−2". Iron Link's MUI
 * sheet reads "+0" and "-2" (`signedZero`, `asciiMinus`); changes.md row 36
 * proposes this form for both.
 */
export function formatSigned(
  value: number,
  options: FormatSignedOptions = {},
): string {
  if (value > 0) return `+${value}`;
  if (value < 0) {
    return `${options.asciiMinus ? "-" : MINUS}${Math.abs(value)}`;
  }
  return options.signedZero ? "+0" : "0";
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
