import type { Datasworn } from "@datasworn-community/core";
import { describe, expect, it, vi } from "vitest";

import { computeEffectivePlayset } from "../effectivePlayset";
import {
  buildWorldOracleCatalog,
  getFrozenWorldOracleBinding,
  getWorldOracleChoices,
  loadWorldOracleCatalog,
  pinWorldOracleChoice,
} from "../worldOracleCatalog";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
const baseId = "oracle_rollable:base/names/given";
const expId = "oracle_rollable:exp/names/given";
function pkg(id: string, replaces?: string[]): Datasworn.RulesPackage {
  return {
    _id: id,
    title: id,
    type: "ruleset",
    oracles: {
      names: {
        _id: `oracle_collection:${id}/names`,
        name: "Names",
        type: "oracle_collection",
        contents: {
          given: {
            _id: `oracle_rollable:${id}/names/given`,
            name: "Given",
            type: "oracle_rollable",
            replaces,
          },
        },
      },
    },
  } as unknown as Datasworn.RulesPackage;
}
const tree = {
  base: pkg("base"),
  exp: pkg("exp", [baseId]),
  other: pkg("other"),
};
const game = (exp = false, excludes = false) => ({
  rulesets: { base: true },
  expansions: { base: { exp } },
  playset: excludes ? { excludes: { oracles: { [expId]: true } } } : {},
});

describe("world oracle catalog", () => {
  it("uses standalone scope, merged replacements, and explicitly expands to all loaded packages", () => {
    const catalog = buildWorldOracleCatalog(
      tree,
      computeEffectivePlayset([], ["base", "exp"]),
    );
    expect(getWorldOracleChoices(catalog).map((choice) => choice.id)).toEqual([
      expId,
    ]);
    expect(getWorldOracleChoices(catalog, true)).toHaveLength(2);
    expect(getWorldOracleChoices(catalog, false, true)).toHaveLength(2);
  });
  it("respects one game's exclusions and unions multiple games", () => {
    const one = buildWorldOracleCatalog(
      tree,
      computeEffectivePlayset([game(true, true)]),
    );
    expect(getWorldOracleChoices(one).map((choice) => choice.id)).toEqual([
      baseId,
    ]);
    const multi = buildWorldOracleCatalog(
      tree,
      computeEffectivePlayset([game(true, true), game(true)]),
    );
    expect(getWorldOracleChoices(multi).map((choice) => choice.id)).toEqual([
      expId,
    ]);
  });
  it("reports deterministic collisions independently of package iteration order", () => {
    const catalog = buildWorldOracleCatalog(
      { ...tree, aexp: pkg("aexp", [baseId]) },
      computeEffectivePlayset([], ["base", "exp", "aexp"]),
    );
    expect(catalog.collisions[baseId]).toEqual([
      "oracle_rollable:aexp/names/given",
      expId,
    ]);
    expect(catalog.replacementMap[baseId]).toBe(
      "oracle_rollable:aexp/names/given",
    );
  });
  it("freezes stored resolution through divergence and missing targets without mutating the pin", () => {
    const catalog = buildWorldOracleCatalog(
      tree,
      computeEffectivePlayset([game(true)]),
    );
    const binding = Object.freeze({
      packageId: "base",
      oracleId: baseId,
      resolvedOracleId: baseId,
    });
    const state = getFrozenWorldOracleBinding(binding, catalog);
    expect(state.oracleId).toBe(baseId);
    expect(state.divergence?.nextOracleId).toBe(expId);
    expect(state.missing).toBe(false);
    expect(
      getFrozenWorldOracleBinding(
        { ...binding, resolvedOracleId: "oracle_rollable:gone/missing" },
        catalog,
      ).missing,
    ).toBe(true);
    expect(
      getFrozenWorldOracleBinding({ ...binding, exact: true }, catalog)
        .divergence,
    ).toBeNull();
    expect(
      pinWorldOracleChoice(
        catalog.choices.find((choice) => choice.id === expId)!,
      ),
    ).toEqual({ packageId: "exp", oracleId: expId, resolvedOracleId: expId });
  });
  it("lazily loads registered packages while preserving unavailable binding packages", async () => {
    const blank = await loadWorldOracleCatalog({
      settingKey: null,
      linkedGames: [],
    });
    expect(blank.choices).toHaveLength(0);
    const all = await loadWorldOracleCatalog({
      settingKey: null,
      linkedGames: [],
      allPackages: true,
      bindings: [
        {
          packageId: "missing",
          oracleId: "oracle_rollable:missing/a",
          resolvedOracleId: "oracle_rollable:missing/a",
        },
      ],
    });
    expect(all.choices.length).toBeGreaterThan(100);
    expect(all.missingPackageIds).toEqual(["missing"]);
    expect(getWorldOracleChoices(all)).toHaveLength(0);
    expect(getWorldOracleChoices(all, true).length).toBeGreaterThan(100);
  });
});
