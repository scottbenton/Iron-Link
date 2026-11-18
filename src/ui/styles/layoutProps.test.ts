import { describe, expect, it } from "vitest";

import { withLayoutProps } from "./layoutProps";

describe("withLayoutProps", () => {
  it("returns the props untouched when no layout prop is set", () => {
    const props = { className: "own", title: "Roll" };
    expect(withLayoutProps(props)).toBe(props);
  });

  it("turns layout props into classes ahead of the caller's className", () => {
    const result = withLayoutProps({
      className: "own",
      title: "Roll",
      mt: "2",
      w: { base: "full", md: "40" },
    });
    expect(result).toEqual({
      title: "Roll",
      className: "mt_2 w_full md:w_40 own",
    });
  });

  it("passes kept keys through as the component's own props", () => {
    const result = withLayoutProps({ width: 120, mb: "1" }, ["width"]);
    expect(result).toEqual({ width: 120, className: "mb_1" });
  });

  it("ignores layout props set to undefined", () => {
    expect(withLayoutProps({ mt: undefined, id: "a" })).toEqual({ id: "a" });
  });
});
