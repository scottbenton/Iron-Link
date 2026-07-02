import { Datasworn } from "@datasworn/core";
import { describe, expect, it } from "vitest";

import {
  LinkedGamePlayset,
  buildOracleReplacementMap,
  computeEffectivePlayset,
  getBindingDivergence,
  getGameActivePackageIds,
  getPackageIdFromDataswornId,
  resolveOracleBinding,
} from "../effectivePlayset";

function makeGame(
  rulesets: Record<string, boolean>,
  expansions: Record<string, Record<string, boolean>> = {},
  playset: LinkedGamePlayset["playset"] = {},
): LinkedGamePlayset {
  return { rulesets, expansions, playset };
}

function makeOracle(id: string, replaces?: string[]): Datasworn.OracleRollable {
  return {
    _id: id,
    type: "oracle_rollable",
    replaces,
  } as unknown as Datasworn.OracleRollable;
}

function makeCollection(
  id: string,
  contents: Record<string, Datasworn.OracleRollable>,
  replaces?: string[],
): Datasworn.OracleCollection {
  return {
    _id: id,
    type: "oracle_collection",
    contents,
    replaces,
  } as unknown as Datasworn.OracleCollection;
}

// Minimal tree: base ruleset with a names collection, expansion replacing
// the given_name oracle.
const baseNamesGiven = makeOracle("oracle_rollable:base/names/given");
const basePackage = {
  _id: "base",
  type: "ruleset",
  oracles: {
    names: makeCollection("oracle_collection:base/names", {
      given: baseNamesGiven,
    }),
  },
} as unknown as Datasworn.RulesPackage;

const expNamesGiven = makeOracle("oracle_rollable:exp/names/given", [
  "oracle_rollable:base/names/given",
]);
const expPackage = {
  _id: "exp",
  type: "expansion",
  oracles: {
    names: makeCollection("oracle_collection:exp/names", {
      given: expNamesGiven,
    }),
  },
} as unknown as Datasworn.RulesPackage;

const tree: Record<string, Datasworn.RulesPackage> = {
  base: basePackage,
  exp: expPackage,
};

describe("getGameActivePackageIds", () => {
  it("returns active rulesets and their active expansions", () => {
    const game = makeGame(
      { base: true, other: false },
      { base: { exp: true, exp2: false }, other: { ignored: true } },
    );
    expect(getGameActivePackageIds(game)).toEqual(["base", "exp"]);
  });
});

describe("getPackageIdFromDataswornId", () => {
  it("extracts the package id", () => {
    expect(
      getPackageIdFromDataswornId("oracle_rollable:base/names/given"),
    ).toBe("base");
    expect(getPackageIdFromDataswornId("not-an-id")).toBeUndefined();
  });
});

describe("computeEffectivePlayset", () => {
  it("uses standalone packages with no exclusions when no games are linked", () => {
    const playset = computeEffectivePlayset([], ["base", "base", "exp"]);
    expect(playset.packageIds.sort()).toEqual(["base", "exp"]);
    expect(playset.isOracleIncluded("base", "oracle_rollable:base/x")).toBe(
      true,
    );
    expect(
      playset.isOracleIncluded("missing", "oracle_rollable:missing/x"),
    ).toBe(false);
  });

  it("takes the union of linked games' packages", () => {
    const playset = computeEffectivePlayset([
      makeGame({ base: true }),
      makeGame({ base: true }, { base: { exp: true } }),
    ]);
    expect(playset.packageIds.sort()).toEqual(["base", "exp"]);
  });

  it("absence of a package in one game is not a veto", () => {
    const playset = computeEffectivePlayset([
      makeGame({ base: true }),
      makeGame({ base: true }, { base: { exp: true } }),
    ]);
    expect(
      playset.isOracleIncluded("exp", "oracle_rollable:exp/names/given"),
    ).toBe(true);
  });

  it("an explicit exclusion in every containing playset is respected", () => {
    const playset = computeEffectivePlayset([
      makeGame({ base: true }),
      makeGame(
        { base: true },
        { base: { exp: true } },
        {
          excludes: {
            oracles: { "oracle_rollable:exp/names/given": true },
          },
        },
      ),
    ]);
    expect(
      playset.isOracleIncluded("exp", "oracle_rollable:exp/names/given"),
    ).toBe(false);
  });

  it("an exclusion in one game is overridden by inclusion in another game with the package", () => {
    const playset = computeEffectivePlayset([
      makeGame(
        { base: true },
        { base: { exp: true } },
        {
          excludes: {
            oracles: { "oracle_rollable:exp/names/given": true },
          },
        },
      ),
      makeGame({ base: true }, { base: { exp: true } }),
    ]);
    expect(
      playset.isOracleIncluded("exp", "oracle_rollable:exp/names/given"),
    ).toBe(true);
  });

  it("respects oracle category exclusions on ancestors", () => {
    const playset = computeEffectivePlayset([
      makeGame(
        { base: true },
        {},
        {
          excludes: {
            oracleCategories: { "oracle_collection:base/names": true },
          },
        },
      ),
    ]);
    expect(
      playset.isOracleIncluded("base", "oracle_rollable:base/names/given"),
    ).toBe(false);
    expect(
      playset.isOracleIncluded("base", "oracle_rollable:base/other/oracle"),
    ).toBe(true);
  });
});

describe("buildOracleReplacementMap", () => {
  it("applies oracle-level replaces when the replacing oracle is included", () => {
    const playset = computeEffectivePlayset([
      makeGame({ base: true }, { base: { exp: true } }),
    ]);
    const map = buildOracleReplacementMap(tree, playset);
    expect(map["oracle_rollable:base/names/given"]).toBe(
      "oracle_rollable:exp/names/given",
    );
  });

  it("skips replacements when the replacing oracle is excluded everywhere", () => {
    const playset = computeEffectivePlayset([
      makeGame(
        { base: true },
        { base: { exp: true } },
        {
          excludes: {
            oracles: { "oracle_rollable:exp/names/given": true },
          },
        },
      ),
    ]);
    const map = buildOracleReplacementMap(tree, playset);
    expect(map["oracle_rollable:base/names/given"]).toBeUndefined();
  });

  it("skips replacements from packages outside the effective playset", () => {
    const playset = computeEffectivePlayset([makeGame({ base: true })]);
    const map = buildOracleReplacementMap(tree, playset);
    expect(map["oracle_rollable:base/names/given"]).toBeUndefined();
  });

  it("applies collection-level replaces member-by-member", () => {
    const collectionReplacer = {
      _id: "exp2",
      type: "expansion",
      oracles: {
        names: makeCollection(
          "oracle_collection:exp2/names",
          { given: makeOracle("oracle_rollable:exp2/names/given") },
          ["oracle_collection:base/names"],
        ),
      },
    } as unknown as Datasworn.RulesPackage;

    const playset = computeEffectivePlayset([
      makeGame({ base: true }, { base: { exp2: true } }),
    ]);
    const map = buildOracleReplacementMap(
      { base: basePackage, exp2: collectionReplacer },
      playset,
    );
    expect(map["oracle_rollable:base/names/given"]).toBe(
      "oracle_rollable:exp2/names/given",
    );
  });

  it("tiebreaks deterministically when two packages replace the same oracle", () => {
    const otherReplacer = {
      _id: "aexp",
      type: "expansion",
      oracles: {
        names: makeCollection("oracle_collection:aexp/names", {
          given: makeOracle("oracle_rollable:aexp/names/given", [
            "oracle_rollable:base/names/given",
          ]),
        }),
      },
    } as unknown as Datasworn.RulesPackage;

    const playset = computeEffectivePlayset([
      makeGame({ base: true }, { base: { exp: true, aexp: true } }),
    ]);
    const map = buildOracleReplacementMap(
      { ...tree, aexp: otherReplacer },
      playset,
    );
    expect(map["oracle_rollable:base/names/given"]).toBe(
      "oracle_rollable:aexp/names/given",
    );
  });
});

describe("resolveOracleBinding and getBindingDivergence", () => {
  const replacementMap = {
    "oracle_rollable:base/names/given": "oracle_rollable:exp/names/given",
  };

  it("resolves through the replacement map", () => {
    expect(
      resolveOracleBinding(
        {
          oracleId: "oracle_rollable:base/names/given",
          resolvedOracleId: "oracle_rollable:base/names/given",
        },
        replacementMap,
      ),
    ).toBe("oracle_rollable:exp/names/given");
  });

  it("exact bindings ignore replacements", () => {
    expect(
      resolveOracleBinding(
        {
          oracleId: "oracle_rollable:base/names/given",
          resolvedOracleId: "oracle_rollable:base/names/given",
          exact: true,
        },
        replacementMap,
      ),
    ).toBe("oracle_rollable:base/names/given");
  });

  it("reports divergence against the stored resolution", () => {
    expect(
      getBindingDivergence(
        {
          oracleId: "oracle_rollable:base/names/given",
          resolvedOracleId: "oracle_rollable:base/names/given",
        },
        replacementMap,
      ),
    ).toEqual({
      previousOracleId: "oracle_rollable:base/names/given",
      nextOracleId: "oracle_rollable:exp/names/given",
    });
  });

  it("returns null when the resolution has not changed", () => {
    expect(
      getBindingDivergence(
        {
          oracleId: "oracle_rollable:base/names/given",
          resolvedOracleId: "oracle_rollable:exp/names/given",
        },
        replacementMap,
      ),
    ).toBeNull();
  });
});
