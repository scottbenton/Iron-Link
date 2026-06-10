import { RollResult } from "repositories/shared.types";

export const TICKS_PER_BOX = 4;
export const MAX_TICKS = 40;
export const MAX_PROGRESS_SCORE = MAX_TICKS / TICKS_PER_BOX;

/**
 * Converts a track's tick count (0-40) to its progress score: the number of
 * fully-filled boxes (0-10) that progress rolls compare against the challenge
 * dice. Partially-filled boxes do not count.
 *
 * Throws if ticks is not an integer in [0, MAX_TICKS] — that always indicates
 * a caller bug (e.g. passing a pre-divided score instead of raw ticks).
 */
export function getProgressScore(ticks: number): number {
  if (!Number.isInteger(ticks) || ticks < 0 || ticks > MAX_TICKS) {
    throw new Error(
      `getProgressScore expects an integer tick count between 0 and ${MAX_TICKS}, got ${ticks}`,
    );
  }
  return Math.floor(ticks / TICKS_PER_BOX);
}

/**
 * Scores a progress roll: the progress score must beat (not tie) each
 * challenge die individually.
 */
export function getProgressRollResult(
  progressScore: number,
  challenge1: number,
  challenge2: number,
): RollResult {
  if (progressScore > challenge1 && progressScore > challenge2) {
    return RollResult.StrongHit;
  }
  if (progressScore <= challenge1 && progressScore <= challenge2) {
    return RollResult.Miss;
  }
  return RollResult.WeakHit;
}
