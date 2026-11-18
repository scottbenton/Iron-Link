// @vitest-environment node
import type { Datasworn } from "@datasworn-community/core";
import { describe, expect, it, vi } from "vitest";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";
import { WorldFieldType } from "services/worldFieldDefinitions.service";

import { computeEffectivePlayset } from "../effectivePlayset";
import { buildWorldOracleCatalog } from "../worldOracleCatalog";
import {
  WORLD_PAGE_MIN_MAIN_WIDTH,
  WORLD_REFERENCE_WIDTH,
  getCategoryBoundOracles,
  getWorldReferencePlacement,
  getWorldReferenceRules,
} from "../worldReference";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

function pkg(id: string): Datasworn.RulesPackage {
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
          },
          family: {
            _id: `oracle_rollable:${id}/names/family`,
            name: "Family",
            type: "oracle_rollable",
          },
        },
      },
    },
  } as unknown as Datasworn.RulesPackage;
}

describe("getWorldReferenceRules", () => {
  it("keeps the playset's packages and excludes oracles no game includes", () => {
    const playset = computeEffectivePlayset([
      {
        rulesets: { base: true },
        expansions: {},
        playset: {
          excludes: { oracles: { "oracle_rollable:base/names/family": true } },
        },
      },
    ]);
    // "bound" is loaded only because a stored binding points at it.
    const catalog = buildWorldOracleCatalog(
      { base: pkg("base"), bound: pkg("bound") },
      playset,
    );

    const rules = getWorldReferenceRules(catalog);

    expect(Object.keys(rules.tree)).toEqual(["base"]);
    expect(rules.playset).toEqual({
      excludes: { oracles: { "oracle_rollable:base/names/family": true } },
    });
  });

  it("excludes nothing when every oracle is included", () => {
    const catalog = buildWorldOracleCatalog(
      { base: pkg("base") },
      computeEffectivePlayset([], ["base"]),
    );
    expect(getWorldReferenceRules(catalog).playset).toEqual({});
  });
});

function field(
  overrides: Partial<IWorldFieldDefinition> & { id: string },
): IWorldFieldDefinition {
  return {
    categoryId: "npcs",
    worldId: "world",
    key: overrides.id,
    label: overrides.id,
    type: WorldFieldType.Text,
    binding: null,
    gmOnly: false,
    sortOrder: 0,
    configuration: {
      version: 1,
      suggestions: [],
      helpText: "",
      visible: true,
      rules: [],
    },
    ...overrides,
  };
}

const binding = (oracleId: string) => ({
  packageId: "base",
  oracleId,
  resolvedOracleId: oracleId,
});

describe("getCategoryBoundOracles", () => {
  const fields = [
    field({
      id: "role",
      label: "Role",
      sortOrder: 2,
      binding: binding("role"),
    }),
    field({
      id: "name",
      label: "Name",
      sortOrder: 1,
      binding: binding("given"),
      configuration: {
        version: 1,
        suggestions: [],
        helpText: "",
        visible: true,
        rules: [
          { conditions: [], binding: binding("family") },
          { conditions: [], binding: null },
        ],
      },
    }),
    field({
      id: "alias",
      label: "Alias",
      sortOrder: 3,
      binding: binding("given"),
    }),
    field({
      id: "secret",
      label: "Secret",
      sortOrder: 4,
      gmOnly: true,
      binding: binding("secret"),
    }),
    field({ id: "notes", label: "Notes", sortOrder: 5 }),
    field({
      id: "other",
      categoryId: "places",
      binding: binding("place"),
    }),
  ];

  it("lists each oracle once, in field order, with the fields that roll it", () => {
    expect(getCategoryBoundOracles(fields, "npcs", false)).toEqual([
      { oracleId: "given", fieldLabels: ["Name", "Alias"] },
      { oracleId: "family", fieldLabels: ["Name"] },
      { oracleId: "role", fieldLabels: ["Role"] },
    ]);
  });

  it("includes Guide-only fields for Guides", () => {
    expect(
      getCategoryBoundOracles(fields, "npcs", true).map(
        (oracle) => oracle.oracleId,
      ),
    ).toEqual(["given", "family", "role", "secret"]);
  });
});

describe("getWorldReferencePlacement", () => {
  const room = WORLD_PAGE_MIN_MAIN_WIDTH + WORLD_REFERENCE_WIDTH;
  it("docks Reference while the page has room for both", () => {
    expect(getWorldReferencePlacement(room)).toBe("docked");
    expect(getWorldReferencePlacement(undefined)).toBe("docked");
  });
  it("collapses it to a strip below that", () => {
    expect(getWorldReferencePlacement(room - 1)).toBe("strip");
  });
});
