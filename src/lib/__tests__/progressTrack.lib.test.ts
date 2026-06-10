import { describe, expect, it } from "vitest";

import { RollResult } from "repositories/shared.types";

import {
  MAX_PROGRESS_SCORE,
  MAX_TICKS,
  getProgressRollResult,
  getProgressScore,
} from "../progressTrack.lib";

describe("getProgressScore", () => {
  it("counts only fully-filled boxes", () => {
    expect(getProgressScore(0)).toBe(0);
    expect(getProgressScore(3)).toBe(0);
    expect(getProgressScore(4)).toBe(1);
    expect(getProgressScore(7)).toBe(1);
    expect(getProgressScore(8)).toBe(2);
    expect(getProgressScore(39)).toBe(9);
    expect(getProgressScore(MAX_TICKS)).toBe(MAX_PROGRESS_SCORE);
  });

  it("throws when given a tick count outside the track bounds", () => {
    expect(() => getProgressScore(-1)).toThrow();
    expect(() => getProgressScore(MAX_TICKS + 1)).toThrow();
  });

  it("throws when given a non-integer tick count", () => {
    // Catches callers passing a pre-divided score (e.g. ticks / 4)
    expect(() => getProgressScore(1.75)).toThrow();
    expect(() => getProgressScore(NaN)).toThrow();
  });
});

describe("getProgressRollResult", () => {
  it("returns a strong hit when progress beats both challenge dice", () => {
    expect(getProgressRollResult(5, 4, 4)).toBe(RollResult.StrongHit);
    expect(getProgressRollResult(10, 9, 1)).toBe(RollResult.StrongHit);
  });

  it("returns a weak hit when progress beats only one challenge die", () => {
    expect(getProgressRollResult(5, 4, 5)).toBe(RollResult.WeakHit);
    expect(getProgressRollResult(5, 9, 1)).toBe(RollResult.WeakHit);
  });

  it("returns a miss when progress beats neither challenge die", () => {
    expect(getProgressRollResult(5, 5, 5)).toBe(RollResult.Miss);
    expect(getProgressRollResult(0, 1, 1)).toBe(RollResult.Miss);
  });

  it("treats ties as losses to the challenge die", () => {
    expect(getProgressRollResult(6, 6, 2)).toBe(RollResult.WeakHit);
    expect(getProgressRollResult(6, 6, 6)).toBe(RollResult.Miss);
  });
});
