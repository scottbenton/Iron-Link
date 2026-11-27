import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TestWrapper } from "tests/TestWrapper";
import { mockWindowWidth } from "tests/mockWindowWidth";

import { useIsBreakpoint } from "../useIsBreakpoint";
import { useIsMobile } from "../useIsMobile";

// Pins where the app's breakpoint hooks switch today (MUI's breakpoints:
// sm 600, md 900, lg 1200, xl 1536, in CSS pixels), so moving them onto
// the library's breakpoint table keeps every switch at the same pixel.

let restoreWidth = () => {};
function setWidth(width: number) {
  restoreWidth = mockWindowWidth(width);
}
afterEach(() => restoreWidth());

function isBreakpoint(
  width: number,
  comparator: Parameters<typeof useIsBreakpoint>[0],
  breakpoint: Parameters<typeof useIsBreakpoint>[1],
) {
  setWidth(width);
  const { result } = renderHook(() => useIsBreakpoint(comparator, breakpoint), {
    wrapper: TestWrapper,
  });
  return result.current;
}

describe("useIsBreakpoint", () => {
  // [width, comparator, breakpoint, expected]
  const cases: [
    number,
    Parameters<typeof useIsBreakpoint>[0],
    Parameters<typeof useIsBreakpoint>[1],
    boolean,
  ][] = [
    [599, "smaller-than", "sm", true],
    [600, "smaller-than", "sm", false],
    [899, "smaller-than", "md", true],
    [899.5, "smaller-than", "md", true],
    [900, "smaller-than", "md", false],
    [1199, "greater-than", "lg", false],
    [1200, "greater-than", "lg", true],
    [1536, "greater-than", "xl", true],
    [899, "equal-to", "md", false],
    [900, "equal-to", "md", true],
    [1199, "equal-to", "md", true],
    [1200, "equal-to", "md", false],
    [599, "equal-to", "sm", false],
    [600, "equal-to", "sm", true],
    [899, "equal-to", "sm", true],
  ];

  it.each(cases)(
    "at %spx, %s %s is %s",
    (width, comparator, breakpoint, expected) => {
      expect(isBreakpoint(width, comparator, breakpoint)).toBe(expected);
    },
  );
});

describe("useIsMobile", () => {
  it.each([
    [375, true],
    [899, true],
    [900, false],
    [1280, false],
  ])("at %spx is %s (phone below 900px)", (width, expected) => {
    setWidth(width);
    const { result } = renderHook(() => useIsMobile(), {
      wrapper: TestWrapper,
    });
    expect(result.current).toBe(expected);
  });
});
