import { describe, expect, it } from "vitest";

import {
  type IWorldFieldDefinition,
  type WorldFieldConfiguration,
  WorldFieldType,
} from "types/worldField.type";

import {
  type WorldFieldCondition,
  type WorldFieldKind,
  type WorldFieldSnapshot,
  canWorldFieldBeAncestorSelector,
  canWorldFieldBeConditionSource,
  canWorldFieldHaveOracleBinding,
  changeWorldFieldKind,
  createWorldFieldConfiguration,
  generateWorldFieldKey,
  getWorldFieldChangeBlocker,
  getWorldFieldConditionOperators,
  getWorldFieldConditionReferences,
  getWorldFieldKind,
  isWorldFieldConditionCompatible,
  isWorldFieldConditionValueValid,
  normalizeWorldFieldConfiguration,
  normalizeWorldFieldDefinition,
  normalizeWorldFieldOptions,
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
  entry: {
    id: "entry",
    values: { source: "yes", tags: [], picked: ["Ruin", "Wilds"] },
  },
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
  it("recognizes empty lists, checks membership, and does not compare missing values", () => {
    for (const [fieldId, operator, value, expected] of [
      ["tags", "isEmpty", "anything", true],
      ["missing", "notEquals", "anything", false],
      ["picked", "contains", "Ruin", true],
      ["picked", "contains", "Ruins", false],
      ["picked", "notContains", "Settlement", true],
      ["picked", "notContains", "Wilds", false],
      ["missing", "notContains", "Ruin", false],
      // Membership is not equality: a single value never "contains".
      ["source", "contains", "yes", false],
      ["picked", "equals", "Ruin", false],
    ] as const) {
      const configured = {
        ...definition,
        configuration: createWorldFieldConfiguration({
          visible: false,
          rules: [
            {
              conditions: [{ source: "entry", fieldId, operator, value }],
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
  it("stops at a missing ancestor and at loops above the entry", () => {
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
                operator: "isNotEmpty",
                ancestor: { fieldId: "type", value: "Area" },
              },
            ],
            visible: true,
          },
        ],
      }),
    };
    const area = {
      id: "area",
      parentId: null,
      values: { type: "Area", region: "Reaches" },
    };
    const child = { id: "entry", parentId: "near", values: {} };
    // Control: the Area two levels up matches when the chain is complete.
    expect(
      resolveFieldDefinition(configured, {
        entry: child,
        entries: {
          near: { id: "near", parentId: "hidden", values: {} },
          area: area,
          hidden: { id: "hidden", parentId: "area", values: {} },
          entry: child,
        },
      }).visible,
    ).toBe(true);
    // The chain breaks at an ancestor this client cannot see.
    expect(
      resolveFieldDefinition(configured, {
        entry: child,
        entries: {
          near: { id: "near", parentId: "hidden", values: {} },
          area: area,
          entry: child,
        },
      }).visible,
    ).toBe(false);
    // A loop above the entry ends the walk instead of spinning.
    expect(
      resolveFieldDefinition(configured, {
        entry: child,
        entries: {
          near: { id: "near", parentId: "far", values: {} },
          far: { id: "far", parentId: "near", values: {} },
          area: area,
          entry: child,
        },
      }).visible,
    ).toBe(false);
  });
  it.each([
    ["Reaches", "Island", "Reaches"],
    ["Custom Region", "Island", "Editable fallback"],
    ["", "Island", "Editable fallback"],
    [undefined, "Island", "Editable fallback"],
    ["Reaches", "NPC", "Base label"],
  ])(
    "uses the nearest eligible ancestor with region %s and entry type %s",
    (region, entryType, expectedLabel) => {
      const baseBinding = {
        packageId: "test",
        oracleId: "oracle_rollable:test/base",
        resolvedOracleId: "oracle_rollable:test/base",
      };
      const configured = {
        ...definition,
        binding: baseBinding,
        configuration: createWorldFieldConfiguration({
          visible: false,
          rules: [
            ...["Myriads", "Reaches"].map((value) => ({
              conditions: [
                {
                  source: "entry" as const,
                  fieldId: "type",
                  operator: "equals" as const,
                  value: "Island",
                },
                {
                  source: "ancestor" as const,
                  fieldId: "region",
                  operator: "equals" as const,
                  value,
                  ancestor: { fieldId: "type", value: "Area" },
                },
              ],
              label: value,
              visible: true,
              binding: {
                packageId: "test",
                oracleId: `oracle_rollable:test/${value}`,
                resolvedOracleId: `oracle_rollable:test/${value}`,
              },
            })),
            {
              conditions: [
                {
                  source: "entry",
                  fieldId: "type",
                  operator: "equals",
                  value: "Island",
                },
              ],
              label: "Editable fallback",
              visible: true,
              binding: null,
            },
          ],
        }),
      };
      const resolved = resolveFieldDefinition(configured, {
        entry: { id: "child", parentId: "parent", values: { type: entryType } },
        entries: {
          parent: {
            id: "parent",
            parentId: "inner",
            values: { type: "Settlement" },
          },
          inner: {
            id: "inner",
            parentId: "outer",
            values: { type: "Area", region },
          },
          outer: { id: "outer", values: { type: "Area", region: "Myriads" } },
        },
      });
      expect(resolved.label).toBe(expectedLabel);
      if (expectedLabel === "Reaches") {
        expect(resolved.binding?.oracleId).toBe("oracle_rollable:test/Reaches");
        expect(resolved.visible).toBe(true);
      } else if (expectedLabel === "Editable fallback") {
        expect(resolved.binding).toBeNull();
        expect(resolved.visible).toBe(true);
      } else {
        expect(resolved.binding).toBe(baseBinding);
        expect(resolved.visible).toBe(false);
      }
    },
  );
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

const TARGET = "11111111-1111-4111-8111-111111111111";
const OTHER_TARGET = "22222222-2222-4222-8222-222222222222";

function shape(
  type: WorldFieldType,
  configuration: Partial<WorldFieldConfiguration> = {},
) {
  return { type, configuration: createWorldFieldConfiguration(configuration) };
}
const text = shape(WorldFieldType.Text);
const longText = shape(WorldFieldType.RichText);
const list = (multiple = false, allowOther = true) =>
  shape(WorldFieldType.Select, { multiple, allowOther, suggestions: ["A"] });
const linked = (multiple = false, targetCategoryId = TARGET) =>
  shape(WorldFieldType.Select, {
    multiple,
    allowOther: false,
    targetCategoryId,
  });

describe("field kinds", () => {
  it("derives the kind from the storage type and source", () => {
    expect(getWorldFieldKind(text)).toBe("text");
    expect(getWorldFieldKind(longText)).toBe("longText");
    expect(getWorldFieldKind(list())).toBe("optionList");
    expect(getWorldFieldKind(linked())).toBe("linkedEntry");
    expect(canWorldFieldHaveOracleBinding(text)).toBe(true);
    expect(canWorldFieldHaveOracleBinding(list(true))).toBe(true);
    expect(canWorldFieldHaveOracleBinding(longText)).toBe(false);
    expect(canWorldFieldHaveOracleBinding(linked())).toBe(false);
  });
  it("builds a draft for each kind, keeping rules and dropping bindings it cannot hold", () => {
    const binding = {
      packageId: "classic",
      oracleId: "oracle",
      resolvedOracleId: "oracle",
    };
    const base = {
      ...definition,
      binding,
      configuration: createWorldFieldConfiguration({
        helpText: "Help",
        rules: [{ conditions: [condition], binding }],
      }),
    };
    const kinds: [WorldFieldKind, Partial<WorldFieldConfiguration>][] = [
      ["text", {}],
      ["longText", {}],
      ["optionList", { multiple: false, allowOther: true }],
      ["linkedEntry", { multiple: false, allowOther: false }],
    ];
    for (const [kind, expected] of kinds) {
      const changed = changeWorldFieldKind(base, kind);
      expect(getWorldFieldKind(changed)).toBe(kind);
      expect(changed.configuration).toMatchObject({
        helpText: "Help",
        suggestions: [],
        ...expected,
      });
      const bindable = kind === "text" || kind === "optionList";
      expect(changed.binding).toBe(bindable ? binding : null);
      expect(changed.configuration.rules[0].binding).toBe(
        bindable ? binding : undefined,
      );
    }
  });
});

describe("configuration normalization", () => {
  it("gives each storage type its own configuration shape", () => {
    const stored = {
      version: 1,
      suggestions: [" Planet ", "Planet", "", "Star", 3],
      targetCategoryId: TARGET,
      multiple: true,
      allowOther: true,
    };
    expect(
      normalizeWorldFieldConfiguration(
        { ...stored, targetCategoryId: undefined },
        WorldFieldType.Select,
      ),
    ).toMatchObject({
      suggestions: ["Planet", "Star"],
      multiple: true,
      allowOther: true,
    });
    const category = normalizeWorldFieldConfiguration(
      stored,
      WorldFieldType.Select,
    );
    expect(category).toMatchObject({
      targetCategoryId: TARGET,
      suggestions: [],
      multiple: true,
      allowOther: false,
    });
    for (const type of [WorldFieldType.Text, WorldFieldType.RichText]) {
      const normalized = normalizeWorldFieldConfiguration(stored, type);
      expect(normalized.suggestions).toEqual([]);
      expect(normalized).not.toHaveProperty("multiple");
      expect(normalized).not.toHaveProperty("allowOther");
      expect(normalized).not.toHaveProperty("targetCategoryId");
    }
    // Postgres accepts IDs without RFC version or variant bits.
    expect(
      getWorldFieldKind({
        type: WorldFieldType.Select,
        configuration: normalizeWorldFieldConfiguration(
          {
            version: 1,
            targetCategoryId: "11111111-1111-1111-1111-111111111111",
          },
          WorldFieldType.Select,
        ),
      }),
    ).toBe("linkedEntry");
    expect(
      normalizeWorldFieldConfiguration({ version: 1 }, WorldFieldType.Select),
    ).toMatchObject({ multiple: false, allowOther: false, suggestions: [] });
  });
  it("keeps options the database accepts", () => {
    expect(
      normalizeWorldFieldOptions([
        " Ruin ",
        "Ruin",
        "",
        "   ",
        "x".repeat(1001),
        "x".repeat(1000),
        7,
      ]),
    ).toEqual(["Ruin", "x".repeat(1000)]);
    expect(isWorldFieldConditionValueValid(text, "x".repeat(1001))).toBe(false);
  });
  it("strips field and rule bindings from fields that cannot roll", () => {
    const binding = {
      packageId: "classic",
      oracleId: "oracle",
      resolvedOracleId: "oracle",
    };
    const rules = [{ conditions: [condition], binding }];
    for (const [shaped, keeps] of [
      [text, true],
      [list(), true],
      [longText, false],
      [linked(), false],
    ] as const) {
      const normalized = normalizeWorldFieldDefinition({
        ...shaped,
        binding,
        configuration: { ...shaped.configuration, rules },
      });
      expect(normalized.binding).toBe(keeps ? binding : null);
      expect(normalized.configuration.rules[0].binding).toBe(
        keeps ? binding : undefined,
      );
    }
  });
});

describe("conditions by source", () => {
  it("offers equality on single values and membership on several", () => {
    const single = ["equals", "notEquals", "isEmpty", "isNotEmpty"];
    expect(getWorldFieldConditionOperators(text)).toEqual(single);
    expect(getWorldFieldConditionOperators(list())).toEqual(single);
    expect(getWorldFieldConditionOperators(linked())).toEqual(single);
    const multiple = ["contains", "notContains", "isEmpty", "isNotEmpty"];
    expect(getWorldFieldConditionOperators(list(true))).toEqual(multiple);
    expect(getWorldFieldConditionOperators(linked(true))).toEqual(multiple);
    expect(getWorldFieldConditionOperators(longText)).toEqual([]);
    expect(canWorldFieldBeConditionSource(longText)).toBe(false);
    expect(isWorldFieldConditionCompatible(list(true), "equals")).toBe(false);
    expect(isWorldFieldConditionCompatible(text, "contains")).toBe(false);
  });
  it("requires a picked value, and an entry ID for a linked entry", () => {
    expect(isWorldFieldConditionValueValid(text, "Planet")).toBe(true);
    expect(isWorldFieldConditionValueValid(text, "")).toBe(false);
    expect(isWorldFieldConditionValueValid(list(), " ")).toBe(false);
    expect(isWorldFieldConditionValueValid(list(), undefined)).toBe(false);
    expect(isWorldFieldConditionValueValid(linked(), "Planet")).toBe(false);
    expect(isWorldFieldConditionValueValid(linked(), "")).toBe(false);
    expect(isWorldFieldConditionValueValid(linked(), TARGET)).toBe(true);
    // Any 8-4-4-4-12 hex ID, as the database accepts it.
    expect(
      isWorldFieldConditionValueValid(
        linked(),
        "ABCDEF01-1111-1111-1111-111111111111",
      ),
    ).toBe(true);
  });
  it("accepts only single Selects as ancestor selectors", () => {
    expect(canWorldFieldBeAncestorSelector(list())).toBe(true);
    expect(canWorldFieldBeAncestorSelector(linked())).toBe(true);
    expect(canWorldFieldBeAncestorSelector(list(true))).toBe(false);
    expect(canWorldFieldBeAncestorSelector(text)).toBe(false);
    expect(canWorldFieldBeAncestorSelector(longText)).toBe(false);
  });
});

describe("field changes with stored values", () => {
  const counts = { valueCount: 7, multiValueCount: 0 };
  it.each([
    ["a configuration-only change", list(false, true), list(false, false)],
    ["single to multi on a list", list(), list(true)],
    ["single to multi on a link", linked(), linked(true)],
    ["multi to single without multi values", list(true), list()],
    ["a single list to Text", list(), text],
    ["Text to an open single list", text, list(false, true)],
    // Strict lists check values only as they are written.
    ["Text to a strict single list", text, list(false, false)],
  ])("allows %s", (_, from, to) => {
    expect(getWorldFieldChangeBlocker(from, to, counts)).toBeNull();
  });
  it.each([
    ["Text to Long text", text, longText],
    ["Long text to Text", longText, text],
    ["a list to a link", list(), linked()],
    ["a link to a list", linked(), list()],
    ["a multi list to Text", list(true), text],
    ["Text to a multi list", text, list(true)],
    ["a link to Text", linked(), text],
  ])("blocks %s", (_, from, to) => {
    expect(getWorldFieldChangeBlocker(from, to, counts)).toBe(
      "incompatibleType",
    );
  });
  it("blocks multi to single while an entry stores several values", () => {
    expect(
      getWorldFieldChangeBlocker(list(true), list(), {
        valueCount: 7,
        multiValueCount: 2,
      }),
    ).toBe("multipleValues");
  });
  it("blocks a change of target category", () => {
    expect(
      getWorldFieldChangeBlocker(linked(), linked(false, OTHER_TARGET), counts),
    ).toBe("targetCategory");
  });
  it("allows anything while no values are stored", () => {
    expect(
      getWorldFieldChangeBlocker(text, longText, {
        valueCount: 0,
        multiValueCount: 0,
      }),
    ).toBeNull();
  });
  it("ties generated keys to UUIDs", () => {
    expect(generateWorldFieldKey("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "field_550e8400e29b41d4a716446655440000",
    );
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
