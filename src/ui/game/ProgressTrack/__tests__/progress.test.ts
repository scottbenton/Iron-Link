import { describe, expect, it } from "vitest";

import {
  describeMark,
  getBoxTicks,
  getProgressScore,
  getProgressValueText,
} from "../progress";

describe("progress helpers", () => {
  it("scores full boxes only", () => {
    expect(getProgressScore(0)).toBe(0);
    expect(getProgressScore(15)).toBe(3);
    expect(getProgressScore(40)).toBe(10);
    expect(getProgressScore(55)).toBe(10);
  });

  it("splits ticks across the ten boxes", () => {
    expect(getBoxTicks(14)).toEqual([4, 4, 4, 2, 0, 0, 0, 0, 0, 0]);
    expect(getBoxTicks(-3)).toEqual(Array(10).fill(0));
  });

  it("reads a track out", () => {
    expect(getProgressValueText(12)).toBe("3 of 10 boxes filled");
    expect(getProgressValueText(14)).toBe(
      "3 of 10 boxes filled, and 2 of 4 ticks",
    );
  });

  it("describes what a mark adds", () => {
    expect(describeMark(8)).toBe("2 boxes per mark");
    expect(describeMark(4)).toBe("1 box per mark");
    expect(describeMark(1)).toBe("1 tick per mark");
    expect(describeMark(2)).toBe("2 ticks per mark");
  });
});
