import { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";
import { beforeEach, describe, expect, it } from "vitest";

import { getDataswornItem } from "components/datasworn/DataswornDialog/useGetDataswornItem";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { getMove } from "../useMove";
import { getOracleCollection } from "../useOracleCollection";
import { getOracleRollable } from "../useOracleRollable";

const activeRules = {
  [starforged._id]: starforged,
  [sunderedIsles._id]: sunderedIsles,
} as unknown as Record<string, Datasworn.RulesPackage>;

describe("resolved Datasworn item accessors", () => {
  beforeEach(() => {
    useDataswornTreeStore.getState().setActiveRules(activeRules, {});
  });

  it("resolves replaced oracle rollable ids to active replacements", () => {
    expect(
      getOracleRollable(
        "oracle_rollable:starforged/character/name/given_name",
      )?._id,
    ).toEqual("oracle_rollable:sundered_isles/character/name/given_name");
  });

  it("resolves replaced oracle collection ids to active replacements", () => {
    expect(
      getOracleCollection("oracle_collection:starforged/character/name")?._id,
    ).toEqual("oracle_collection:sundered_isles/character/name");
  });

  it("resolves replaced move ids to active replacements", () => {
    expect(getMove("move:starforged/recover/repair")?._id).toEqual(
      "move:sundered_isles/recover/repair",
    );
  });

  it("uses resolved items for Datasworn dialog lookups", () => {
    const item = getDataswornItem("move:starforged/recover/repair");

    expect(item?.type).toEqual("move");
    if (item?.type === "move") {
      expect(item.move._id).toEqual("move:sundered_isles/recover/repair");
    }
  });

  it("does not resolve replacements from excluded collections", () => {
    useDataswornTreeStore.getState().setActiveRules(activeRules, {
      excludes: {
        moveCategories: {
          "move_category:sundered_isles/recover": true,
        },
      },
    });

    expect(getMove("move:starforged/recover/repair")?._id).toEqual(
      "move:starforged/recover/repair",
    );
  });
});
