import { describe, expect, it } from "vitest";

import { referenceTabMap } from "../data/referenceTabs";
import {
  isPackageShown,
  isSourceShown,
} from "../stores/referenceSettings.store";

describe("reference sources", () => {
  const classic = referenceTabMap.classic;
  const sunderedIsles = referenceTabMap.sundered_isles;

  it("follows each source's default", () => {
    expect(isPackageShown(sunderedIsles, "assets", "starforged", {})).toBe(
      true,
    );
    expect(isPackageShown(sunderedIsles, "moves", "starsmith", {})).toBe(false);
  });

  it("only hides a scoped source in its own sections", () => {
    const overrides = { "starforged:assets": false };
    expect(
      isPackageShown(sunderedIsles, "assets", "starforged", overrides),
    ).toBe(false);
    expect(
      isPackageShown(sunderedIsles, "moves", "starforged", overrides),
    ).toBe(true);
  });

  it("hides a source whose dependency is off", () => {
    const lodestar = classic.sources.find((s) => s.key === "lodestar")!;
    expect(isSourceShown(classic, lodestar, { delve: false })).toBe(false);
    expect(isSourceShown(classic, lodestar, {})).toBe(true);
  });

  it("always shows the tab's own rules", () => {
    expect(
      isPackageShown(classic, "moves", "classic", { classic: false }),
    ).toBe(true);
    expect(isPackageShown(classic, "moves", undefined, {})).toBe(true);
  });
});
