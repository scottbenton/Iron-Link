import { describe, expect, it } from "vitest";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import {
  type WorldFieldCondition,
  type WorldFieldSnapshot,
  areWorldFieldDefinitionsCompatible,
  areWorldFieldTypesCompatible,
  canChangeWorldFieldType,
  createWorldFieldConfiguration,
  generateWorldFieldKey,
  getWorldFieldConditionReferences,
  isWorldCategoryReferenceType,
  isWorldFieldConditionCompatible,
  normalizeWorldFieldConfiguration,
  resolveFieldDefinition,
} from "../worldFieldRules";

const definition = {
  id: "definition",
  key: "stable",
  categoryId: "category",
  worldId: "world",
  type: "text",
  label: "Base label",
  binding: null,
  gmOnly: false,
  sortOrder: 1,
  configuration: createWorldFieldConfiguration({ helpText: "Base help" }),
} as IWorldFieldDefinition;
const snapshot: WorldFieldSnapshot = {
  entry: { id: "entry", values: { source: "yes", zero: 0, tags: [] } },
  entries: {},
};
const condition: WorldFieldCondition = {
  source: "entry",
  fieldId: "source",
  operator: "equals",
  value: "yes",
};

describe("field rule resolution", () => {
  it("uses only the first matching rule and inherits omitted base properties", () => {
    const configured = {
      ...definition,
      configuration: createWorldFieldConfiguration({
        helpText: "Base help",
        rules: [
          { conditions: [condition], label: "Changed" },
          { conditions: [condition], helpText: "Later", visible: false },
        ],
      }),
    };
    expect(resolveFieldDefinition(configured, snapshot)).toMatchObject({
      id: "definition",
      key: "stable",
      type: "text",
      gmOnly: false,
      visible: true,
      label: "Changed",
      helpText: "Base help",
      binding: null,
    });
    expect(configured.label).toBe("Base label");
  });
  it("supports explicit unbound overrides and falls back when conditions miss", () => {
    const configured = {
      ...definition,
      binding: {
        packageId: "classic",
        oracleId: "pinned",
        resolvedOracleId: "pinned",
      },
      configuration: createWorldFieldConfiguration({
        rules: [{ conditions: [condition], binding: null }],
      }),
    };
    expect(resolveFieldDefinition(configured, snapshot).binding).toBeNull();
    expect(
      resolveFieldDefinition(configured, {
        ...snapshot,
        entry: { id: "other", values: {} },
      }).binding,
    ).toBe(configured.binding);
  });
  it("keeps zero nonempty, recognizes empty tags, and does not compare missing values", () => {
    for (const [fieldId, operator, expected] of [
      ["zero", "isNotEmpty", true],
      ["tags", "isEmpty", true],
      ["missing", "notEquals", false],
    ] as const) {
      const configured = {
        ...definition,
        configuration: createWorldFieldConfiguration({
          visible: false,
          rules: [
            {
              conditions: [
                { source: "entry", fieldId, operator, value: "anything" },
              ],
              visible: true,
            },
          ],
        }),
      };
      expect(resolveFieldDefinition(configured, snapshot).visible).toBe(
        expected,
      );
    }
  });
  it("terminates cycles and never treats a missing ancestor as an empty match", () => {
    const configured = {
      ...definition,
      configuration: createWorldFieldConfiguration({
        visible: false,
        rules: [
          {
            conditions: [
              {
                source: "ancestor",
                fieldId: "region",
                operator: "isEmpty",
                ancestor: { fieldId: "type", value: "Area" },
              },
            ],
            visible: true,
          },
        ],
      }),
    };
    const cyclic = { id: "entry", parentId: "other", values: {} };
    expect(
      resolveFieldDefinition(configured, {
        entry: cyclic,
        entries: {
          other: { id: "other", parentId: "entry", values: {} },
          entry: cyclic,
        },
      }).visible,
    ).toBe(false);
  });
  it("defaults legacy definitions and creates independent configuration arrays", () => {
    expect(normalizeWorldFieldConfiguration(null)).toEqual(
      createWorldFieldConfiguration(),
    );
    const one = createWorldFieldConfiguration();
    one.suggestions.push("custom");
    expect(createWorldFieldConfiguration().suggestions).toEqual([]);
  });
  it("normalizes a UUID category target while discarding malformed targets", () => {
    const targetCategoryId = "11111111-1111-4111-8111-111111111111";
    expect(
      normalizeWorldFieldConfiguration({
        version: 1,
        targetCategoryId,
      }).targetCategoryId,
    ).toBe(targetCategoryId);
    expect(
      normalizeWorldFieldConfiguration({
        version: 1,
        targetCategoryId: "not-a-uuid",
      }).targetCategoryId,
    ).toBeUndefined();
    expect(createWorldFieldConfiguration().targetCategoryId).toBeUndefined();
  });
});

describe("field identity and compatibility", () => {
  it("ties generated keys to UUIDs and permits only lossless stored-value transitions", () => {
    expect(generateWorldFieldKey("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "field_550e8400e29b41d4a716446655440000",
    );
    expect(areWorldFieldTypesCompatible("richText", "oracleText")).toBe(true);
    expect(areWorldFieldTypesCompatible("text", "oracleText")).toBe(false);
    expect(canChangeWorldFieldType("text", "number", 0)).toBe(true);
    expect(canChangeWorldFieldType("text", "number", 1)).toBe(false);
    expect(isWorldFieldConditionCompatible("oracleText", "equals")).toBe(false);
    expect(isWorldFieldConditionCompatible("number", "isEmpty")).toBe(true);
    expect(isWorldCategoryReferenceType("categorySelect")).toBe(true);
    expect(isWorldCategoryReferenceType("categoryMultiSelect")).toBe(true);
    expect(isWorldFieldConditionCompatible("categorySelect", "isEmpty")).toBe(
      false,
    );
  });
  it("treats a reference target as part of stored-value compatibility", () => {
    const sameTarget = {
      ...definition,
      type: "categorySelect" as IWorldFieldDefinition["type"],
      configuration: createWorldFieldConfiguration({
        targetCategoryId: "11111111-1111-4111-8111-111111111111",
      }),
    };
    expect(areWorldFieldDefinitionsCompatible(sameTarget, sameTarget)).toBe(
      true,
    );
    expect(
      areWorldFieldDefinitionsCompatible(sameTarget, {
        ...sameTarget,
        configuration: createWorldFieldConfiguration({
          targetCategoryId: "22222222-2222-4222-8222-222222222222",
        }),
      }),
    ).toBe(false);
    expect(
      areWorldFieldDefinitionsCompatible(sameTarget, {
        ...sameTarget,
        type: "categoryMultiSelect" as IWorldFieldDefinition["type"],
      }),
    ).toBe(false);
  });
  it("collects source and ancestor-selector references without duplicates", () => {
    expect(
      getWorldFieldConditionReferences(
        createWorldFieldConfiguration({
          rules: [
            {
              conditions: [
                condition,
                {
                  ...condition,
                  source: "ancestor",
                  ancestor: { fieldId: "type", value: "Area" },
                },
              ],
            },
          ],
        }),
      ),
    ).toEqual(["source", "type"]);
  });
});
