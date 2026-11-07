import { describe, expect, it } from "vitest";

import { isOpenPath } from "pages/pathConfig";

import {
  getCandidateIds,
  getParentCollectionId,
  getReferenceItemHref,
  parseReferencePath,
  resolveReferenceTab,
  splitDataswornId,
} from "../data/referencePaths";
import {
  defaultReferenceTabId,
  getHomeTabId,
  referenceTabMap,
  tabLoadsPackage,
} from "../data/referenceTabs";

describe("parseReferencePath", () => {
  it("splits a list URL", () => {
    expect(parseReferencePath("starforged/moves")).toEqual({
      packageId: "starforged",
      section: "moves",
    });
  });

  it("keeps the rest of the id as the item path", () => {
    expect(
      parseReferencePath("starforged/oracles/planets/desert/feature"),
    ).toEqual({
      packageId: "starforged",
      section: "oracles",
      itemPath: "planets/desert/feature",
    });
  });

  it("ignores empty segments", () => {
    expect(parseReferencePath("/classic//moves/")).toEqual({
      packageId: "classic",
      section: "moves",
    });
    expect(parseReferencePath(undefined)).toEqual({});
  });
});

describe("reference item links", () => {
  it("turns a Datasworn id into a path and back", () => {
    const id = "move:starforged/adventure/face_danger";
    const href = getReferenceItemHref(id);
    expect(href).toBe("/reference/starforged/moves/adventure/face_danger");

    const parsed = parseReferencePath(href!.replace("/reference/", ""));
    expect(
      getCandidateIds(parsed.packageId!, "moves", parsed.itemPath!),
    ).toContain(id);
  });

  it("offers the item type before the collection type", () => {
    expect(getCandidateIds("starforged", "assets", "path")).toEqual([
      "asset:starforged/path",
      "asset_collection:starforged/path",
    ]);
    expect(getCandidateIds("starforged", "rules", "stats")).toEqual([]);
  });

  it("gives collections a path in their section", () => {
    expect(getReferenceItemHref("oracle_collection:starforged/planets")).toBe(
      "/reference/starforged/oracles/planets",
    );
  });

  it("gives embedded and malformed ids no path", () => {
    expect(
      getReferenceItemHref(
        "oracle_rollable.move:starforged/exploration/make_a_discovery",
      ),
    ).toBeUndefined();
    expect(splitDataswornId("move:starforged")).toBeUndefined();
    expect(splitDataswornId("not an id")).toBeUndefined();
  });

  it("finds the collection an item sits in", () => {
    expect(getParentCollectionId("move:starforged/adventure/face_danger")).toBe(
      "move_category:starforged/adventure",
    );
    expect(
      getParentCollectionId(
        "oracle_rollable:starforged/planets/desert/feature",
      ),
    ).toBe("oracle_collection:starforged/planets/desert");
    expect(
      getParentCollectionId("move_category:starforged/adventure"),
    ).toBeUndefined();
  });
});

describe("resolveReferenceTab", () => {
  const resolve = (
    splat: string,
    storedTabId: string | undefined,
    rejectedTabId?: string,
  ) =>
    resolveReferenceTab({
      parsed: parseReferencePath(splat),
      storedTabId,
      rejectedTabId,
      getHomeTabId,
      tabLoadsPackage,
      isTab: (tabId) => !!referenceTabMap[tabId],
      defaultTabId: defaultReferenceTabId,
    });

  it("uses the tab a list URL names", () => {
    expect(resolve("sundered_isles/moves", "classic")).toBe("sundered_isles");
  });

  it("opens an expansion's list in its home tab", () => {
    expect(resolve("delve/moves", "starforged")).toBe("classic");
  });

  it("keeps the open tab when it shows the item", () => {
    expect(
      resolve("starforged/moves/adventure/face_danger", "sundered_isles"),
    ).toBe("sundered_isles");
  });

  it("opens the package's home tab when the open tab can't show the item", () => {
    expect(resolve("starforged/moves/adventure/face_danger", "classic")).toBe(
      "starforged",
    );
    expect(resolve("delve/moves/delve/delve_the_depths", undefined)).toBe(
      "classic",
    );
  });

  it("leaves a tab the item turned out to be missing from", () => {
    expect(
      resolve(
        "starforged/assets/command_vehicle/starship",
        "sundered_isles",
        "sundered_isles",
      ),
    ).toBe("starforged");
  });

  it("keeps the open tab for Ask the Oracle, which every tab loads", () => {
    expect(resolve("ironlink/oracles/ask_the_oracle/likely", "elegy")).toBe(
      "elegy",
    );
  });

  it("falls back to the stored tab, then the default", () => {
    expect(resolve("", "elegy")).toBe("elegy");
    expect(resolve("", "removed_tab")).toBe(defaultReferenceTabId);
    expect(resolve("homebrew_thing/moves/a/b", undefined)).toBe(
      defaultReferenceTabId,
    );
  });
});

describe("isOpenPath", () => {
  it("opens every reference page to signed out visitors", () => {
    expect(isOpenPath("/reference")).toBe(true);
    expect(
      isOpenPath("/reference/starforged/moves/adventure/face_danger"),
    ).toBe(true);
  });

  it("doesn't open paths that only start with the same letters", () => {
    expect(isOpenPath("/referenceable")).toBe(false);
    expect(isOpenPath("/games")).toBe(false);
  });
});
