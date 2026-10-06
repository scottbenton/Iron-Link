import { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";
import { describe, expect, it } from "vitest";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

describe("useDataswornTreeStore setActiveRules", () => {
  // Rules packages are shared module singletons that Immer freezes when they
  // enter the store, so building the store must never write to them.
  it("builds the store from frozen rules packages without mutating them", () => {
    const frozenTree = deepFreeze(
      JSON.parse(
        JSON.stringify({
          [starforged._id]: starforged,
          [sunderedIsles._id]: sunderedIsles,
        }),
      ),
    ) as Record<string, Datasworn.RulesPackage>;

    expect(() =>
      useDataswornTreeStore.getState().setActiveRules(frozenTree, {
        excludes: {
          assetCategories: { "asset_collection:starforged/path": true },
        },
      }),
    ).not.toThrow();

    const { assets, oracles } = useDataswornTreeStore.getState();
    expect(
      assets.assetCollectionMap["asset_collection:starforged/path"],
    ).toBeUndefined();
    expect(
      oracles.oracleRollableMap[
        "oracle_rollable:sundered_isles/character/name/given_name"
      ],
    ).toBeDefined();
  });
});
