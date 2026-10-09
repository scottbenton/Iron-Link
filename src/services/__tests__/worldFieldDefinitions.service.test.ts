import { describe, expect, it, vi } from "vitest";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import {
  WorldFieldDefinitionsService,
  WorldFieldType,
} from "../worldFieldDefinitions.service";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

describe("WorldFieldDefinitionsService", () => {
  it("sends inherited bindings with only the rules that override the oracle", () => {
    const binding = {
      packageId: "starforged",
      oracleId: "oracle_rollable:starforged/a",
      resolvedOracleId: "oracle_rollable:sundered_isles/a",
    };
    const conditions = [
      {
        source: "entry" as const,
        fieldId: "type",
        operator: "equals" as const,
        value: "Planet",
      },
    ];
    expect(
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO([
        {
          id: "field",
          worldId: "world",
          categoryId: "category",
          key: "description",
          label: "Description",
          type: WorldFieldType.OracleText,
          binding,
          configuration: {
            ...createWorldFieldConfiguration(),
            rules: [
              { conditions, visible: false },
              { conditions, binding: null },
            ],
          },
          gmOnly: false,
          sortOrder: 0,
        },
      ]),
    ).toEqual([
      {
        id: "field",
        binding,
        rule_bindings: [{ index: 1, binding: null, conditions }],
      },
    ]);
    expect(
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO(undefined),
    ).toBeUndefined();
  });
});
