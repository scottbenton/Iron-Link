import { describe, expect, it } from "vitest";

import {
  TICK_ANIMATION_BUDGET_MS,
  getTickAnimationPlan,
  getTickAnimationTotal,
} from "./tickAnimation";

describe("tick animation plans", () => {
  it("finishes within the budget however many ticks are added", () => {
    for (const [from, to] of [
      [0, 1],
      [14, 18],
      [3, 15],
      [0, 40],
      [39, 40],
    ]) {
      const total = getTickAnimationTotal(getTickAnimationPlan(from, to));
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(TICK_ANIMATION_BUDGET_MS);
    }
  });

  it("steps through new ticks in order", () => {
    const plan = getTickAnimationPlan(14, 18);
    expect(plan.steps.slice(13, 19)).toEqual([
      undefined,
      0,
      1,
      2,
      3,
      undefined,
    ]);
  });

  it("plans nothing for an erase", () => {
    expect(getTickAnimationTotal(getTickAnimationPlan(18, 14))).toBe(0);
  });
});
