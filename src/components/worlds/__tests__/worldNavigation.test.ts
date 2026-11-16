// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  type WorldView,
  getWorldViewPath,
  parseWorldViewPath,
} from "../worldNavigation";

const views: WorldView[] = [
  { type: "world" },
  { type: "category", categoryId: "c" },
  { type: "entry", categoryId: "c", entryId: "e" },
  { type: "entry", categoryId: "c", entryId: "e", section: "places" },
  { type: "entry", categoryId: "c", entryId: "e", section: "map" },
  { type: "truths" },
  { type: "settings" },
  { type: "category-settings", categoryId: "c" },
];

describe("parseWorldViewPath", () => {
  it.each(views)("reads back the path built for %o", (view) => {
    expect(parseWorldViewPath(getWorldViewPath("w", view))).toEqual({
      worldId: "w",
      view,
    });
  });

  it("round-trips ids that need encoding", () => {
    const view: WorldView = {
      type: "entry",
      categoryId: "a/b",
      entryId: "50% off?",
      section: "map",
    };
    const path = getWorldViewPath("w#1", view);
    expect(path).toBe(
      "/worlds/w%231/categories/a%2Fb/entries/50%25%20off%3F/map",
    );
    expect(parseWorldViewPath(path)).toEqual({ worldId: "w#1", view });
  });

  it("tolerates trailing slashes", () => {
    expect(parseWorldViewPath("/worlds/w/")).toEqual({
      worldId: "w",
      view: { type: "world" },
    });
    expect(
      parseWorldViewPath("/worlds/w/categories/c/entries/e/places//"),
    ).toEqual({
      worldId: "w",
      view: { type: "entry", categoryId: "c", entryId: "e", section: "places" },
    });
  });

  it.each([
    "/",
    "/worlds",
    "/worlds/",
    "/worlds/create",
    "/games/g",
    "worlds/w",
    "/worlds/w/garbage",
    "/worlds/w/categories",
    "/worlds/w/categories/c/entries",
    "/worlds/w/categories/c/nope",
    "/worlds/w/categories/c/entries/e/nope",
    "/worlds/w/categories/c/entries/e/places/more",
    "/worlds/w/settings/garbage",
    "/worlds/w/settings/categories",
    "/worlds/w/settings/categories/c/more",
    "/worlds//categories/c",
    "/worlds/w/categories//entries/e",
    "/worlds/%E0%A4%A",
  ])("rejects %s", (path) => {
    expect(parseWorldViewPath(path)).toBeNull();
  });
});
