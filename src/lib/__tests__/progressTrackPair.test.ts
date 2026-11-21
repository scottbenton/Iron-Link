/**
 * Progress maths, app and library side by side (migration slice 4). Every
 * score, die pair and tick count a track can have, so a swap to one source
 * cannot change a result.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useProgressTrackValueText } from "components/datasworn/ProgressTrack/useProgressTrackValueText";

import {
  MAX_TICKS as LIBRARY_MAX_TICKS,
  TICKS_PER_BOX as LIBRARY_TICKS_PER_BOX,
  PROGRESS_BOXES,
  getProgressBoxes as getLibraryProgressBoxes,
  getProgressScore as getLibraryProgressScore,
  getProgressText,
  getProgressValueText,
  ticksPerMark,
} from "ui/game/ProgressTrack/progress";
import { getRollOutcome } from "ui/game/RollCard/rollTypes";

import { i18n } from "i18n/config";

import { RollResult } from "repositories/shared.types";
import { Difficulty } from "repositories/tracks.repository";

import {
  MAX_PROGRESS_SCORE,
  MAX_TICKS,
  TICKS_PER_BOX,
  getProgressBoxes,
  getProgressRollResult,
  getProgressScore,
} from "../progressTrack.lib";
import { CONNECTION_PROGRESS_TICKS } from "../worldBonds.lib";

const t = i18n.t.bind(i18n);

const ticks = Array.from({ length: MAX_TICKS + 1 }, (_, index) => index);
const scores = Array.from({ length: 11 }, (_, index) => index);
const dice = Array.from({ length: 10 }, (_, index) => index + 1);

const outcomeOf: Record<RollResult, ReturnType<typeof getRollOutcome>> = {
  [RollResult.StrongHit]: "strongHit",
  [RollResult.WeakHit]: "weakHit",
  [RollResult.Miss]: "miss",
};

describe("progress maths, app and library", () => {
  it("share the track's size", () => {
    expect(TICKS_PER_BOX).toBe(LIBRARY_TICKS_PER_BOX);
    expect(MAX_TICKS).toBe(LIBRARY_MAX_TICKS);
    expect(MAX_PROGRESS_SCORE).toBe(PROGRESS_BOXES);
  });

  it("score every tick count alike", () => {
    for (const tick of ticks) {
      expect(getProgressScore(tick)).toBe(getLibraryProgressScore(tick));
    }
  });

  it("differ on ticks off the track: the app throws, the library clamps", () => {
    for (const tick of [-1, 41, 2.5]) {
      expect(() => getProgressScore(tick)).toThrow();
    }
    expect(getLibraryProgressScore(-1)).toBe(0);
    expect(getLibraryProgressScore(41)).toBe(10);
    expect(getLibraryProgressScore(2.5)).toBe(0);
  });

  it("split ticks into boxes alike, off the track too", () => {
    for (const tick of [-5, -1, ...ticks, 41, 45, 2.5, 39.9]) {
      expect(getProgressBoxes(tick)).toEqual(getLibraryProgressBoxes(tick));
    }
  });

  it("score every progress roll alike", () => {
    for (const score of scores) {
      for (const first of dice) {
        for (const second of dice) {
          expect(outcomeOf[getProgressRollResult(score, first, second)]).toBe(
            getRollOutcome(score, [first, second]),
          );
        }
      }
    }
  });

  it("read every tick count out alike", () => {
    const { result } = renderHook(() => useProgressTrackValueText());
    const strings = getProgressText(t);
    for (const tick of ticks) {
      expect(result.current(tick)).toBe(getProgressValueText(tick, strings));
    }
    expect(result.current(10)).toBe("2 of 10 boxes filled, and 2 of 4 ticks");
    expect(result.current(12)).toBe("3 of 10 boxes filled");
  });

  it("mark progress by the same ticks at every rank", () => {
    for (const difficulty of Object.values(Difficulty)) {
      expect(CONNECTION_PROGRESS_TICKS[difficulty]).toBe(
        ticksPerMark[difficulty],
      );
    }
  });
});
