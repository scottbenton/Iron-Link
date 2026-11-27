import { formatSigned } from "ui/game/shared/format";

/**
 * Formats a stat or meter value the way the sheet shows it: "+3", "+0",
 * "-2". There is exactly one sign, so a negative value never reads "--2".
 * The library formats it, in the sheet's form (changes.md row 36).
 */
export function formatSignedValue(value: number): string {
  return formatSigned(value, { signedZero: true, asciiMinus: true });
}
