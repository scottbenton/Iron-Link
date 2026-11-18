/** Clamps a clock's value to 0 to `segments`, rounding to whole segments. */
export function clampClockValue(value: number, segments: number): number {
  return Math.min(Math.max(Math.round(value), 0), segments);
}

/**
 * The value after advancing a clock by one segment (its centre), or null
 * when it is full and the centre does nothing.
 */
export function advanceClock(value: number, segments: number): number | null {
  const current = clampClockValue(value, segments);
  return current >= segments ? null : current + 1;
}
