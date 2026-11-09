import { describe, expect, it } from "vitest";

import { formatSignedValue } from "../formatSignedValue";

describe("formatSignedValue", () => {
  it("gives every value exactly one sign", () => {
    expect(formatSignedValue(3)).toBe("+3");
    expect(formatSignedValue(0)).toBe("+0");
    expect(formatSignedValue(-2)).toBe("-2");
  });
});
