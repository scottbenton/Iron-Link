import { describe, expect, it } from "vitest";

import {
  getRouteFocusKey,
  shouldMoveFocusOnRouteChange,
} from "../routeFocus.lib";

describe("getRouteFocusKey", () => {
  it("treats a game's overview, characters and Add Character as one page", () => {
    expect(getRouteFocusKey("/games/abc")).toBe("/games/abc");
    expect(getRouteFocusKey("/games/abc/")).toBe("/games/abc");
    expect(getRouteFocusKey("/games/abc/c/kai")).toBe("/games/abc");
    expect(getRouteFocusKey("/games/abc/create")).toBe("/games/abc");
  });

  it("keeps the second screen and Create Game as their own pages", () => {
    expect(getRouteFocusKey("/games/abc/display")).toBe("/games/abc/display");
    expect(getRouteFocusKey("/games/create")).toBe("/games/create");
    expect(getRouteFocusKey("/games")).toBe("/games");
  });

  it("treats an entry's Places tab as the entry", () => {
    expect(getRouteFocusKey("/worlds/w/categories/c/entries/e/places")).toBe(
      "/worlds/w/categories/c/entries/e",
    );
  });

  it("keeps other world destinations apart", () => {
    expect(getRouteFocusKey("/worlds/w")).toBe("/worlds/w");
    expect(getRouteFocusKey("/worlds/w/categories/c")).toBe(
      "/worlds/w/categories/c",
    );
  });
});

describe("shouldMoveFocusOnRouteChange", () => {
  it("moves focus to a new page", () => {
    expect(shouldMoveFocusOnRouteChange("/games", "/worlds", false)).toBe(true);
  });

  it("leaves focus within a page while the control is still there", () => {
    expect(
      shouldMoveFocusOnRouteChange("/games/abc", "/games/abc/c/kai", false),
    ).toBe(false);
  });

  it("moves focus within a page when the control went away", () => {
    expect(
      shouldMoveFocusOnRouteChange("/games/abc", "/games/abc/create", true),
    ).toBe(true);
  });

  it("does nothing when the path did not change", () => {
    expect(shouldMoveFocusOnRouteChange("/games", "/games", true)).toBe(false);
  });
});
