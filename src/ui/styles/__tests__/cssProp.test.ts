import { describe, expect, it } from "vitest";

import { withCssProp } from "../cssProp";

describe("withCssProp", () => {
  it("drops an unset css prop and leaves the rest alone", () => {
    expect(withCssProp({ className: "own", title: "Roll" })).toEqual({
      className: "own",
      title: "Roll",
    });
    expect(withCssProp({ css: undefined, id: "a" })).toEqual({ id: "a" });
  });

  it("turns css into classes ahead of the caller's className", () => {
    const result = withCssProp({
      className: "own",
      title: "Roll",
      css: { mt: "2", w: { base: "full", md: "40" } },
    });
    expect(result).toEqual({
      title: "Roll",
      className: "mt_2 w_full md:w_40 own",
    });
  });
});
