import { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";
import { describe, expect, it } from "vitest";

import { parseCollectionsIntoMaps } from "../parseCollectionsIntoMaps";

const activeRules = {
  [starforged._id]: starforged,
  [sunderedIsles._id]: sunderedIsles,
} as unknown as Record<string, Datasworn.RulesPackage>;

const emptyExclusions = {
  collectionExclusions: {},
  itemExclusions: {},
};

describe("parseCollectionsIntoMaps", () => {
  it("renders replacing oracle collections in their natural location and aliases replaced ids", () => {
    const maps = parseCollectionsIntoMaps<Datasworn.OracleCollection>(
      activeRules,
      emptyExclusions,
      "oracle_collection:*/*",
    );

    expect(
      maps.rootCollections.starforged.rootCollectionIds,
    ).not.toContain("oracle_collection:starforged/character");
    expect(maps.rootCollections.starforged.rootCollectionIds).toContain(
      "oracle_collection:sundered_isles/character",
    );

    expect(
      maps.collectionAliases["oracle_collection:starforged/character/name"],
    ).toEqual("oracle_collection:sundered_isles/character/name");
    expect(
      maps.collectionMap["oracle_collection:starforged/character/name"]._id,
    ).toEqual("oracle_collection:sundered_isles/character/name");

    const characterCollection =
      maps.collectionMap["oracle_collection:sundered_isles/character"];
    expect("collections" in characterCollection).toEqual(true);
    if (!("collections" in characterCollection)) return;

    expect(
      characterCollection.collections[
        "oracle_collection:sundered_isles/character/name"
      ]._id,
    ).toEqual("oracle_collection:sundered_isles/character/name");
  });

  it("aliases replaced oracle rollables to their replacements", () => {
    const maps = parseCollectionsIntoMaps<Datasworn.OracleCollection>(
      activeRules,
      emptyExclusions,
      "oracle_collection:*/*",
    );

    expect(
      maps.itemAliases[
        "oracle_rollable:starforged/character/name/given_name"
      ],
    ).toEqual("oracle_rollable:sundered_isles/character/name/given_name");
    expect(
      maps.itemMap["oracle_rollable:starforged/character/name/given_name"]._id,
    ).toEqual("oracle_rollable:sundered_isles/character/name/given_name");
  });

  it("merges enhancing move categories into their targets and removes replaced target moves", () => {
    const maps = parseCollectionsIntoMaps<Datasworn.MoveCategory>(
      activeRules,
      emptyExclusions,
      "move_category:*/*",
    );

    expect(maps.rootCollections.starforged.rootCollectionIds).toContain(
      "move_category:starforged/recover",
    );
    expect(
      maps.rootCollections.sundered_isles?.rootCollectionIds ?? [],
    ).not.toContain("move_category:sundered_isles/recover");

    const recoverMoves =
      maps.collectionMap["move_category:starforged/recover"].contents;
    expect(recoverMoves.repair._id).toEqual(
      "move:sundered_isles/recover/repair",
    );
    expect(maps.itemMap["move:starforged/recover/repair"]._id).toEqual(
      "move:sundered_isles/recover/repair",
    );
  });

  it("does not let excluded collections replace or enhance active targets", () => {
    const maps = parseCollectionsIntoMaps<Datasworn.MoveCategory>(
      activeRules,
      {
        collectionExclusions: {
          "move_category:sundered_isles/recover": true,
        },
        itemExclusions: {},
      },
      "move_category:*/*",
    );

    const recoverMoves =
      maps.collectionMap["move_category:starforged/recover"].contents;
    expect(recoverMoves.repair._id).toEqual("move:starforged/recover/repair");
    expect(maps.itemAliases["move:starforged/recover/repair"]).toBeUndefined();
    expect(maps.itemMap["move:starforged/recover/repair"]._id).toEqual(
      "move:starforged/recover/repair",
    );
  });
});
