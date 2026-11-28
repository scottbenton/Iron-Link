import {
  MAX_TICKS,
  PROGRESS_BOXES,
  ProgressRank,
  getProgressScore as getLibraryProgressScore,
  ticksPerMark,
} from "ui/game/ProgressTrack/progress";
import { getRollOutcome } from "ui/game/RollCard/rollTypes";

import { RollResult } from "repositories/shared.types";
import { Difficulty } from "repositories/tracks.repository";

// The library owns progress maths; the app reads it from there.
export {
  MAX_TICKS,
  TICKS_PER_BOX,
  getProgressBoxes,
} from "ui/game/ProgressTrack/progress";

export const MAX_PROGRESS_SCORE = PROGRESS_BOXES;

/**
 * Converts a track's tick count (0-40) to its progress score: the number of
 * fully-filled boxes (0-10) that progress rolls compare against the challenge
 * dice. Partially-filled boxes do not count.
 *
 * Throws if ticks is not an integer in [0, MAX_TICKS] — that always indicates
 * a caller bug (e.g. passing a pre-divided score instead of raw ticks). The
 * library's version clamps instead, for drawing; a roll should never be
 * scored from a value it had to clamp.
 */
export function getProgressScore(ticks: number): number {
  if (!Number.isInteger(ticks) || ticks < 0 || ticks > MAX_TICKS) {
    throw new Error(
      `getProgressScore expects an integer tick count between 0 and ${MAX_TICKS}, got ${ticks}`,
    );
  }
  return getLibraryProgressScore(ticks);
}

const rollResults = {
  strongHit: RollResult.StrongHit,
  weakHit: RollResult.WeakHit,
  miss: RollResult.Miss,
} as const;

/**
 * Scores a progress roll: the progress score must beat (not tie) each
 * challenge die individually.
 */
export function getProgressRollResult(
  progressScore: number,
  challenge1: number,
  challenge2: number,
): RollResult {
  return rollResults[getRollOutcome(progressScore, [challenge1, challenge2])];
}

const difficultyRanks: Record<Difficulty, ProgressRank> = {
  [Difficulty.Troublesome]: "troublesome",
  [Difficulty.Dangerous]: "dangerous",
  [Difficulty.Formidable]: "formidable",
  [Difficulty.Extreme]: "extreme",
  [Difficulty.Epic]: "epic",
};

/** Ticks one Mark Progress adds to a track of this difficulty. */
export function getTicksPerMark(difficulty: Difficulty): number {
  return ticksPerMark[difficultyRanks[difficulty]];
}

/** The library's name for a track's difficulty, which sets its rank label. */
export function getProgressRank(difficulty: Difficulty): ProgressRank {
  return difficultyRanks[difficulty];
}
