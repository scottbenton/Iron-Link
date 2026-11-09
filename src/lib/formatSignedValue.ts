/**
 * Formats a stat or meter value the way the sheet shows it: "+3", "+0",
 * "-2". There is exactly one sign, so a negative value never reads "--2".
 */
export function formatSignedValue(value: number): string {
  return value < 0 ? `-${Math.abs(value)}` : `+${value}`;
}
