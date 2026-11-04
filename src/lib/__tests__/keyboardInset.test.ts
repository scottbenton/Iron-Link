import { describe, expect, it } from "vitest";

import { computeKeyboardInset } from "../keyboardInset";

describe("computeKeyboardInset", () => {
  it("is 0 with no keyboard", () => {
    expect(
      computeKeyboardInset({
        layoutHeight: 844,
        visualHeight: 844,
        visualOffsetTop: 0,
      }),
    ).toBe(0);
  });

  it("is the height the keyboard covers", () => {
    expect(
      computeKeyboardInset({
        layoutHeight: 844,
        visualHeight: 508,
        visualOffsetTop: 0,
      }),
    ).toBe(336);
  });

  it("counts the visible area scrolled down the layout viewport", () => {
    // iOS scrolls the layout viewport to keep a focused field in view.
    expect(
      computeKeyboardInset({
        layoutHeight: 844,
        visualHeight: 508,
        visualOffsetTop: 120,
      }),
    ).toBe(216);
  });

  it("rounds to whole pixels", () => {
    expect(
      computeKeyboardInset({
        layoutHeight: 844,
        visualHeight: 507.6,
        visualOffsetTop: 0,
      }),
    ).toBe(336);
  });

  it("is never negative, as while pinch zoom moves the visible area", () => {
    expect(
      computeKeyboardInset({
        layoutHeight: 844,
        visualHeight: 400,
        visualOffsetTop: 500,
      }),
    ).toBe(0);
  });
});
