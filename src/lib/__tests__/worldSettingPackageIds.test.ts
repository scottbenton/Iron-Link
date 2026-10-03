import { describe, expect, it } from "vitest";

import { getWorldSettingPackageIds } from "../worldSettingPackageIds";

// Package hints are client oracle scope, independent of database templates.
describe("world setting package hints", () => {
  it("includes the base ruleset for both Sundered Isles setting forms", () => {
    for (const setting of [
      "sundered_isles",
      "world:sundered_isles/sundered_isles",
    ]) {
      expect(getWorldSettingPackageIds(setting)).toEqual([
        "starforged",
        "sundered_isles",
      ]);
    }
  });

  it("has no package hint for a blank world", () => {
    expect(getWorldSettingPackageIds(null)).toEqual([]);
  });
});
