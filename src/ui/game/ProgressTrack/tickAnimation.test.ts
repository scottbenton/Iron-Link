import { describe, expect, it } from "vitest";

import {
  TICK_ANIMATION_BUDGET_MS,
  TickAnimation,
  getTickAnimationPlan,
  getTickAnimationTotal,
} from "./tickAnimation";

const animations: TickAnimation[] = ["sequence", "box", "together", "fade"];

describe("tick animation plans", () => {
  it("finishes within the budget however many ticks are added", () => {
    for (const animation of animations) {
      for (const [from, to] of [
        [0, 1],
        [14, 18],
        [3, 15],
        [0, 40],
        [39, 40],
      ]) {
        const total = getTickAnimationTotal(
          getTickAnimationPlan(animation, from, to),
        );
        expect(total).toBeGreaterThan(0);
        expect(total).toBeLessThanOrEqual(TICK_ANIMATION_BUDGET_MS);
      }
    }
  });

  it("steps through new ticks in order", () => {
    const plan = getTickAnimationPlan("sequence", 14, 18);
    expect(plan.steps.slice(13, 19)).toEqual([
      undefined,
      0,
      1,
      2,
      3,
      undefined,
    ]);
  });

  it("steps box by box", () => {
    const plan = getTickAnimationPlan("box", 3, 15);
    expect(plan.steps.slice(3, 15)).toEqual([
      0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3,
    ]);
  });

  it("plans nothing for an erase or no animation", () => {
    expect(
      getTickAnimationTotal(getTickAnimationPlan("sequence", 18, 14)),
    ).toBe(0);
    expect(getTickAnimationTotal(getTickAnimationPlan("none", 0, 12))).toBe(0);
  });
});
