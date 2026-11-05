import { describe, expect, it } from "vitest";

import { getHeadingComponent } from "../headingLevel";

describe("getHeadingComponent", () => {
  it("keeps the written level with no offset", () => {
    expect(getHeadingComponent(1)).toBe("h1");
    expect(getHeadingComponent(3)).toBe("h3");
  });

  it("nests by the offset", () => {
    expect(getHeadingComponent(1, 2)).toBe("h3");
    expect(getHeadingComponent(2, 2)).toBe("h4");
  });

  it("stays within h1 to h6", () => {
    expect(getHeadingComponent(5, 3)).toBe("h6");
    expect(getHeadingComponent(1, -1)).toBe("h1");
  });
});
