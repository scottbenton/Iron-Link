// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getBreakpointQuery } from "../useBreakpoint";

describe("getBreakpointQuery", () => {
  it("writes smaller-than as Panda's smDown and mdDown", () => {
    expect(getBreakpointQuery("smaller-than", "sm")).toBe("(width < 37.5rem)");
    expect(getBreakpointQuery("smaller-than", "md")).toBe("(width < 56.25rem)");
  });

  it("writes greater-than as the breakpoint's own condition", () => {
    expect(getBreakpointQuery("greater-than", "md")).toBe(
      "(width >= 56.25rem)",
    );
    expect(getBreakpointQuery("greater-than", "xl")).toBe("(width >= 96rem)");
  });

  it("writes equal-to up to just below the next breakpoint", () => {
    expect(getBreakpointQuery("equal-to", "sm")).toBe(
      "(width >= 37.5rem) and (width < 56.25rem)",
    );
    expect(getBreakpointQuery("equal-to", "lg")).toBe(
      "(width >= 75rem) and (width < 96rem)",
    );
  });

  it("gives xl no upper bound", () => {
    expect(getBreakpointQuery("equal-to", "xl")).toBe("(width >= 96rem)");
  });
});
