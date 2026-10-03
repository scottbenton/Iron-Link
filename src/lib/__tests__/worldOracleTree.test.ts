import { type Datasworn, IdParser } from "@datasworn-community/core";
import { describe, expect, it } from "vitest";

import { computeEffectivePlayset } from "../effectivePlayset";
import { buildWorldOracleCatalog } from "../worldOracleCatalog";
import {
  type WorldOracleTreeItem,
  buildWorldOracleTree,
  filterWorldOracleTree,
} from "../worldOracleTree";

const baseId = "oracle_rollable:base/names/given";
const replacementId = "oracle_rollable:exp/names/given";
const familyId = "oracle_rollable:exp/names/family";
function fixture() {
  const tree = {
    base: {
      _id: "base",
      title: "Base Game",
      type: "ruleset",
      oracles: {
        names: {
          _id: "oracle_collection:base/names",
          type: "oracle_collection",
          name: "Names",
          contents: {
            given: { _id: baseId, type: "oracle_rollable", name: "Given name" },
          },
        },
      },
    },
    exp: {
      _id: "exp",
      title: "Expansion",
      type: "expansion",
      ruleset: "base",
      oracles: {
        names: {
          _id: "oracle_collection:exp/names",
          type: "oracle_collection",
          name: "Expanded names",
          enhances: ["oracle_collection:base/names"],
          contents: {
            given: {
              _id: replacementId,
              type: "oracle_rollable",
              name: "Better given name",
              replaces: [baseId],
            },
            family: {
              _id: familyId,
              type: "oracle_rollable",
              name: "Family name",
            },
          },
        },
      },
    },
  } as unknown as Record<string, Datasworn.RulesPackage>;
  return tree;
}
function leafIds(items: WorldOracleTreeItem[]): string[] {
  return items.flatMap((item) =>
    item.choice ? [item.choice.id] : leafIds(item.children ?? []),
  );
}

describe("world oracle presentation tree", () => {
  it("merges expansions into their enhanced collection and base ruleset, keeping the replacement", () => {
    const catalog = buildWorldOracleCatalog(
      fixture(),
      computeEffectivePlayset([], ["base", "exp"]),
    );
    const tree = buildWorldOracleTree(catalog);
    expect(tree.map((item) => item.label)).toEqual(["Base Game"]);
    expect(tree[0].children?.map((item) => item.label)).toEqual(["Names"]);
    expect(leafIds(tree)).toEqual([replacementId, familyId]);
    // Raw choices remain available to resolve old pinned bindings and exact originals.
    expect(catalog.choices.some((choice) => choice.id === baseId)).toBe(true);
  });
  it("shows original choices in exact mode without applying replacements", () => {
    const catalog = buildWorldOracleCatalog(
      fixture(),
      computeEffectivePlayset([], ["base", "exp"]),
    );
    expect(leafIds(buildWorldOracleTree(catalog, false, true)).sort()).toEqual(
      [baseId, replacementId, familyId].sort(),
    );
  });
  it("honors item and collection exclusions and retains originals when replacements are excluded", () => {
    const catalog = buildWorldOracleCatalog(
      fixture(),
      computeEffectivePlayset([
        {
          rulesets: { base: true },
          expansions: { base: { exp: true } },
          playset: {
            excludes: {
              oracleCategories: { "oracle_collection:exp/names": true },
            },
          },
        },
      ]),
    );
    expect(leafIds(buildWorldOracleTree(catalog))).toEqual([baseId]);
    const item = buildWorldOracleCatalog(
      fixture(),
      computeEffectivePlayset([
        {
          rulesets: { base: true },
          expansions: { base: { exp: true } },
          playset: { excludes: { oracles: { [familyId]: true } } },
        },
      ]),
    );
    expect(leafIds(buildWorldOracleTree(item))).toEqual([replacementId]);
  });
  it("offers otherwise inactive packages only through All packages", () => {
    const catalog = buildWorldOracleCatalog(
      fixture(),
      computeEffectivePlayset([], ["base"]),
    );
    expect(leafIds(buildWorldOracleTree(catalog))).toEqual([baseId]);
    expect(leafIds(buildWorldOracleTree(catalog, true)).sort()).toEqual(
      [baseId, replacementId, familyId].sort(),
    );
  });
  it("does not mutate cached packages or the global Datasworn parser tree", () => {
    const source = fixture();
    const before = JSON.stringify(source);
    const gameTree = IdParser.tree;
    const catalog = buildWorldOracleCatalog(
      source,
      computeEffectivePlayset([], ["base", "exp"]),
    );
    buildWorldOracleTree(catalog);
    expect(JSON.stringify(source)).toBe(before);
    expect(IdParser.tree).toBe(gameTree);
  });
  it("merges replacing collections and searches descendants while retaining their hierarchy", () => {
    const source = fixture();
    const expansion = source.exp.oracles!.names;
    delete expansion.enhances;
    expansion.replaces = ["oracle_collection:base/names"];
    const catalog = buildWorldOracleCatalog(
      source,
      computeEffectivePlayset([], ["base", "exp"]),
    );
    const tree = buildWorldOracleTree(catalog);
    expect(tree[0].children?.map((item) => item.label)).toEqual([
      "Expanded names",
    ]);
    const filtered = filterWorldOracleTree(tree, "family");
    expect(filtered[0].label).toBe("Base Game");
    expect(leafIds(filtered)).toEqual([familyId]);
    expect(filterWorldOracleTree(tree, "missing")).toEqual([]);
  });
  it("keeps transitive enhancements in either package iteration order", () => {
    const source = fixture();
    const thirdId = "oracle_rollable:third/names/title";
    source.third = {
      _id: "third",
      title: "Third",
      type: "expansion",
      ruleset: "base",
      oracles: {
        names: {
          _id: "oracle_collection:third/names",
          type: "oracle_collection",
          name: "Titles",
          enhances: ["oracle_collection:exp/names"],
          contents: {
            title: { _id: thirdId, type: "oracle_rollable", name: "Title" },
          },
        },
      },
    } as unknown as Datasworn.RulesPackage;
    const effective = computeEffectivePlayset([], ["base", "exp", "third"]);
    const forward = buildWorldOracleTree(
      buildWorldOracleCatalog(source, effective),
    );
    const reverse = buildWorldOracleTree(
      buildWorldOracleCatalog(
        { third: source.third, exp: source.exp, base: source.base },
        effective,
      ),
    );
    expect(leafIds(forward).sort()).toEqual(
      [replacementId, familyId, thirdId].sort(),
    );
    expect(reverse).toEqual(forward);
  });

  it("retains enhancements when their target collection is replaced", () => {
    const source = fixture();
    const otherId = "oracle_rollable:other/names/title";
    source.other = {
      _id: "other",
      title: "Other",
      type: "expansion",
      ruleset: "base",
      oracles: {
        names: {
          _id: "oracle_collection:other/names",
          type: "oracle_collection",
          name: "Replacement names",
          replaces: ["oracle_collection:base/names"],
          contents: {
            title: { _id: otherId, type: "oracle_rollable", name: "Title" },
          },
        },
      },
    } as unknown as Datasworn.RulesPackage;
    const catalog = buildWorldOracleCatalog(
      source,
      computeEffectivePlayset([], ["base", "exp", "other"]),
    );
    const tree = buildWorldOracleTree(catalog);
    expect(tree[0].children?.map((item) => item.label)).toEqual([
      "Replacement names",
    ]);
    expect(leafIds(tree).sort()).toEqual(
      [replacementId, familyId, otherId].sort(),
    );
  });
  it("keeps a replacement of an enhancement under the original parent", () => {
    const source = fixture();
    const titleId = "oracle_rollable:other/names/title";
    source.other = {
      _id: "other",
      title: "Other",
      type: "expansion",
      ruleset: "base",
      oracles: {
        names: {
          _id: "oracle_collection:other/names",
          type: "oracle_collection",
          name: "Replacement names",
          replaces: ["oracle_collection:exp/names"],
          contents: {
            title: { _id: titleId, type: "oracle_rollable", name: "Title" },
          },
        },
      },
    } as unknown as Datasworn.RulesPackage;
    const tree = buildWorldOracleTree(
      buildWorldOracleCatalog(
        source,
        computeEffectivePlayset([], ["base", "exp", "other"]),
      ),
    );
    expect(tree[0].children?.map((item) => item.label)).toEqual(["Names"]);
    expect(leafIds(tree)).toEqual([titleId]);
  });
});
