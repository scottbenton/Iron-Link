import { describe, expect, it, vi } from "vitest";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import { WorldFieldDefinitionsRepository } from "repositories/worldFieldDefinitions.repository";

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

  it("gives every new field its own identity and a key derived from it", async () => {
    const add = vi
      .spyOn(WorldFieldDefinitionsRepository, "addWorldFieldDefinition")
      .mockResolvedValue();
    const definition = {
      label: "Description",
      type: WorldFieldType.Text,
      sortOrder: 0,
    };

    const first = await WorldFieldDefinitionsService.addWorldFieldDefinition(
      "world",
      "category",
      definition,
    );
    const second = await WorldFieldDefinitionsService.addWorldFieldDefinition(
      "world",
      "category",
      definition,
    );

    expect(first).not.toBe(second);
    expect(add.mock.calls[0][2]).toMatchObject({
      id: first,
      key: `field_${first.replace(/-/g, "")}`,
      label: "Description",
    });
  });
});
