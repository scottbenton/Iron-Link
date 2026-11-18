// @vitest-environment node
import { Datasworn } from "@datasworn-community/core";
import { describe, expect, it } from "vitest";

import type {
  IWorldFieldDefinition,
  OracleBinding,
} from "types/worldField.type";

import {
  LinkedGamePlayset,
  buildOracleReplacementMap,
  computeEffectivePlayset,
} from "../effectivePlayset";
import {
  getWorldOracleBindingSlots,
  getWorldOracleChangeInputs,
  getWorldOracleChangeKey,
  getWorldOracleTargetChanges,
  withLinkedGame,
  withoutLinkedGame,
} from "../worldOracleChanges";

const oracle = (id: string, replaces?: string[]) =>
  ({
    _id: id,
    type: "oracle_rollable",
    replaces,
  }) as unknown as Datasworn.OracleRollable;
const rulesPackage = (
  id: string,
  contents: Record<string, Datasworn.OracleRollable>,
) =>
  ({
    _id: id,
    type: "ruleset",
    oracles: {
      names: {
        _id: `oracle_collection:${id}/names`,
        type: "oracle_collection",
        contents,
      },
    },
  }) as unknown as Datasworn.RulesPackage;

// A base ruleset and an expansion that replaces its given names.
const tree = {
  base: rulesPackage("base", {
    given: oracle("oracle_rollable:base/names/given"),
    family: oracle("oracle_rollable:base/names/family"),
  }),
  exp: rulesPackage("exp", {
    given: oracle("oracle_rollable:exp/names/given", [
      "oracle_rollable:base/names/given",
    ]),
  }),
};

const baseGame: LinkedGamePlayset = {
  rulesets: { base: true },
  expansions: {},
  playset: {},
};
const expansionGame: LinkedGamePlayset = {
  rulesets: { base: true },
  expansions: { base: { exp: true } },
  playset: {},
};
// Has the expansion, but excludes its replacing oracle.
const excludingGame: LinkedGamePlayset = {
  rulesets: { base: true },
  expansions: { base: { exp: true } },
  playset: {
    excludes: { oracles: { "oracle_rollable:exp/names/given": true } },
  },
};

const mapFor = (games: LinkedGamePlayset[]) =>
  buildOracleReplacementMap(tree, computeEffectivePlayset(games));

const binding = (id: string, resolved = id, exact = false): OracleBinding => ({
  packageId: id.split(":")[1].split("/")[0],
  oracleId: id,
  resolvedOracleId: resolved,
  ...(exact ? { exact } : {}),
});

const field = (
  id: string,
  fieldBinding: OracleBinding | null,
  ruleBindings: (OracleBinding | null)[] = [],
): Pick<IWorldFieldDefinition, "id" | "binding" | "configuration"> => ({
  id,
  binding: fieldBinding,
  configuration: {
    version: 1,
    suggestions: [],
    helpText: "",
    visible: true,
    rules: ruleBindings.map((ruleBinding) => ({
      conditions: [],
      ...(ruleBinding ? { binding: ruleBinding } : {}),
    })),
  },
});

const GIVEN = "oracle_rollable:base/names/given";
const EXP_GIVEN = "oracle_rollable:exp/names/given";
const FAMILY = "oracle_rollable:base/names/family";

describe("getWorldOracleBindingSlots", () => {
  it("lists field and rule bindings with their rule index", () => {
    expect(
      getWorldOracleBindingSlots([
        field("a", binding(GIVEN), [null, binding(FAMILY)]),
        field("b", null),
      ]).map(({ fieldId, ruleIndex }) => [fieldId, ruleIndex]),
    ).toEqual([
      ["a", null],
      ["a", 1],
    ]);
  });
});

describe("getWorldOracleTargetChanges", () => {
  const fields = [
    field("name", binding(GIVEN), [binding(GIVEN)]),
    field("family", binding(FAMILY)),
  ];

  it("previews a link that brings in a replacing oracle", () => {
    const changes = getWorldOracleTargetChanges(
      "w",
      true,
      fields,
      mapFor(withLinkedGame([baseGame], expansionGame)),
    );
    expect(changes).toEqual([
      {
        worldId: "w",
        fieldId: "name",
        ruleIndex: null,
        previousOracleId: GIVEN,
        nextOracleId: EXP_GIVEN,
      },
      {
        worldId: "w",
        fieldId: "name",
        ruleIndex: 0,
        previousOracleId: GIVEN,
        nextOracleId: EXP_GIVEN,
      },
    ]);
  });

  it("previews an unlink that takes the replacing oracle away", () => {
    const linked = [baseGame, expansionGame];
    const saved = [field("name", binding(GIVEN, EXP_GIVEN))];
    expect(
      getWorldOracleTargetChanges(
        "w",
        true,
        saved,
        mapFor(withoutLinkedGame(linked, expansionGame)),
      ),
    ).toMatchObject([{ previousOracleId: EXP_GIVEN, nextOracleId: GIVEN }]);
  });

  it("keeps a replacement while any linked game includes it", () => {
    // Several linked games with different playsets: one excluding the
    // replacing oracle is not a veto while another includes it.
    const saved = [field("name", binding(GIVEN, EXP_GIVEN))];
    expect(
      getWorldOracleTargetChanges(
        "w",
        true,
        saved,
        mapFor([excludingGame, expansionGame, baseGame]),
      ),
    ).toEqual([]);
    expect(
      getWorldOracleTargetChanges(
        "w",
        true,
        saved,
        mapFor(
          withoutLinkedGame([excludingGame, expansionGame], expansionGame),
        ),
      ),
    ).toMatchObject([{ previousOracleId: EXP_GIVEN, nextOracleId: GIVEN }]);
  });

  it("finds nothing for a playset edit that leaves targets alone", () => {
    const edited: LinkedGamePlayset = {
      ...baseGame,
      playset: {
        excludes: { oracles: { "oracle_rollable:base/names/family": true } },
      },
    };
    expect(
      getWorldOracleTargetChanges(
        "w",
        true,
        fields,
        mapFor(withLinkedGame(withoutLinkedGame([baseGame], baseGame), edited)),
      ),
    ).toEqual([]);
  });

  it("never moves exact bindings", () => {
    expect(
      getWorldOracleTargetChanges(
        "w",
        true,
        [field("name", binding(GIVEN, GIVEN, true))],
        mapFor([expansionGame]),
      ),
    ).toEqual([]);
  });

  it("finds nothing in a world that inherits its defaults", () => {
    expect(
      getWorldOracleTargetChanges("w", false, fields, mapFor([expansionGame])),
    ).toEqual([]);
  });
});

describe("withoutLinkedGame", () => {
  it("removes one copy of a game's rules, reading missing objects as empty", () => {
    const stored = { rulesets: { base: true } } as unknown as LinkedGamePlayset;
    expect(withoutLinkedGame([stored, stored], baseGame)).toEqual([stored]);
    expect(withoutLinkedGame([expansionGame], baseGame)).toEqual([
      expansionGame,
    ]);
  });
});

describe("getWorldOracleChangeInputs", () => {
  it("marks the changes chosen to keep the old oracle", () => {
    const changes = getWorldOracleTargetChanges(
      "w",
      true,
      [field("name", binding(GIVEN), [binding(GIVEN)])],
      mapFor([expansionGame]),
    );
    const inputs = getWorldOracleChangeInputs(changes, {
      [getWorldOracleChangeKey(changes[1])]: "keep",
    });
    expect(inputs.map((input) => input.keep)).toEqual([false, true]);
  });
});
