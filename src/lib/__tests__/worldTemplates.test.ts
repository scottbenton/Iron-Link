import { validate as isUuid } from "uuid";
import { describe, expect, it } from "vitest";

import { getOrderedPackageConfigs } from "data/package.config";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import {
  type WorldFieldEntrySnapshot,
  resolveFieldDefinition,
} from "../worldFieldRules";
import {
  buildWorldTemplate,
  getWorldSettingPackageIds,
  getWorldTemplateBindings,
} from "../worldTemplates";

const worldId = "09c0d230-3f90-4acb-a407-c8b99e074a2c";
const otherWorldId = "3325bfc5-2c3d-41e2-8068-70b61d4bccdd";

const settings = [
  null,
  "world:classic/ironlands",
  "world:starforged/forge",
  "world:sundered_isles/sundered_isles",
  "world:elegy/santa_maria",
];
function domainField(
  template: ReturnType<typeof buildWorldTemplate>,
  key: string,
  categoryIndex = 0,
): IWorldFieldDefinition {
  const category = template.categories[categoryIndex];
  const field = category.fields.find((field) => field.key === key)!;
  return {
    ...field,
    worldId: "world",
    categoryId: category.id,
    gmOnly: field.gm_only,
    sortOrder: field.sort_order,
  };
}
function entry(
  template: ReturnType<typeof buildWorldTemplate>,
  id: string,
  values: Record<string, string>,
  parentId?: string,
  categoryIndex = 0,
): WorldFieldEntrySnapshot {
  return {
    id,
    parentId,
    values: Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        domainField(template, key, categoryIndex).id,
        value,
      ]),
    ),
  };
}

describe("world templates", () => {
  it.each(settings)(
    "builds stable world-specific identities for %s",
    (setting) => {
      const manifest = buildWorldTemplate(setting, worldId);
      expect(manifest.version).toBe(1);
      expect(manifest.categories.map((category) => category.name)).toEqual([
        "Locations",
        "NPCs",
        "Lore",
        ...([
          "world:starforged/forge",
          "world:sundered_isles/sundered_isles",
        ].includes(setting ?? "")
          ? ["Factions"]
          : []),
      ]);
      const ids: string[] = [];
      for (const category of manifest.categories) {
        ids.push(category.id, ...category.fields.map((field) => field.id));
        const fields = new Map(
          category.fields.map((field) => [field.id, field]),
        );
        expect(
          category.subtitle_field_definition_id == null ||
            fields.has(category.subtitle_field_definition_id),
        ).toBe(true);
        for (const field of category.fields) {
          expect(field.configuration.version).toBe(1);
          for (const rule of field.configuration.rules) {
            for (const condition of rule.conditions) {
              expect(fields.has(condition.fieldId)).toBe(true);
              const source = fields.get(condition.fieldId)!;
              expect(source.type).toBe("text");
              if (source.gm_only) expect(field.gm_only).toBe(true);
              if (condition.ancestor)
                expect(fields.has(condition.ancestor.fieldId)).toBe(true);
            }
          }
        }
      }
      expect(ids.every(isUuid)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
      expect(buildWorldTemplate(setting, worldId)).toEqual(manifest);
      const nextIds = buildWorldTemplate(
        setting,
        otherWorldId,
      ).categories.flatMap((category) => [
        category.id,
        ...category.fields.map((field) => field.id),
      ]);
      expect(nextIds.some((id) => ids.includes(id))).toBe(false);
      expect(manifest.categories[0].fields[0].type).toBe("text");
    },
  );

  it.each(["world:starforged/forge", "world:sundered_isles/sundered_isles"])(
    "appends Factions in %s without inheriting location capabilities",
    (setting) => {
      const manifest = buildWorldTemplate(setting, worldId);
      const factions = manifest.categories[3];
      expect(
        manifest.categories.slice(0, 3).map((category) => ({
          name: category.name,
          order: category.sort_order,
          hierarchy: category.supports_hierarchy,
          map: category.supports_map,
          bonds: category.supports_bonds,
        })),
      ).toEqual([
        {
          name: "Locations",
          order: 0,
          hierarchy: true,
          map: true,
          bonds: true,
        },
        { name: "NPCs", order: 1, hierarchy: false, map: false, bonds: true },
        { name: "Lore", order: 2, hierarchy: false, map: false, bonds: false },
      ]);
      expect(factions).toMatchObject({
        name: "Factions",
        sort_order: 3,
        supports_hierarchy: false,
        supports_map: false,
        supports_bonds: false,
      });
      expect(factions.subtitle_field_definition_id).toBe(
        domainField(manifest, "factionType", 3).id,
      );
      expect(
        factions.fields
          .filter((field) => !field.gm_only)
          .map((field) => field.key),
      ).toEqual(["factionType", "influence"]);
      expect(
        factions.fields.some((field) =>
          ["name", "notes", "gmNotes"].includes(field.key),
        ),
      ).toBe(false);
    },
  );

  it.each([
    ["Dominion", "focus", "dominion", "Focus"],
    ["Guild", "focus", "guild", "Specialty"],
    ["Fringe Group", "focus", "fringe_group", "Role"],
    ["Dominion", "leadership", "dominion_leadership", "Leadership"],
  ])(
    "resolves Forge %s %s against its own oracle",
    (factionType, key, oracle, label) => {
      const manifest = buildWorldTemplate("world:starforged/forge", worldId);
      expect(
        resolveFieldDefinition(domainField(manifest, key, 3), {
          entry: entry(manifest, "faction", { factionType }, undefined, 3),
          entries: {},
        }),
      ).toMatchObject({
        visible: true,
        label,
        binding: { oracleId: `oracle_rollable:starforged/faction/${oracle}` },
      });
    },
  );

  it.each([
    ["Society", "chronicles", "society/chronicles"],
    ["Society", "leadership", "society/overseers"],
    ["Society", "touchstones", "society/touchstones"],
    ["Organization", "role", "organization/type"],
    ["Organization", "methods", "organization/methods"],
    ["Organization", "secrets", "organization/secrets"],
    ["Empire", "leadership", "empire/leadership"],
    ["Empire", "tactics", "empire/tactics"],
    ["Empire", "vulnerabilities", "empire/vulnerabilities"],
    ["The Cursed", "role", "cursed/role"],
  ])(
    "resolves Isles %s %s against its own oracle",
    (factionType, key, oracle) => {
      const manifest = buildWorldTemplate(
        "world:sundered_isles/sundered_isles",
        worldId,
      );
      expect(
        resolveFieldDefinition(domainField(manifest, key, 3), {
          entry: entry(manifest, "faction", { factionType }, undefined, 3),
          entries: {},
        }),
      ).toMatchObject({
        visible: true,
        binding: {
          oracleId: `oracle_rollable:sundered_isles/faction/${oracle}`,
        },
      });
    },
  );

  it("keeps custom faction types valid without borrowing another type's fields", () => {
    for (const setting of [
      "world:starforged/forge",
      "world:sundered_isles/sundered_isles",
    ]) {
      const manifest = buildWorldTemplate(setting, worldId);
      const custom = entry(
        manifest,
        "custom",
        { factionType: "Free Company" },
        undefined,
        3,
      );
      const type = domainField(manifest, "factionType", 3);
      expect(type.type).toBe("text");
      expect(type.configuration.suggestions.length).toBeGreaterThan(0);
      for (const field of manifest.categories[3].fields.filter(
        (field) => field.configuration.rules.length,
      )) {
        expect(
          resolveFieldDefinition(domainField(manifest, field.key, 3), {
            entry: custom,
            entries: {},
          }).visible,
        ).toBe(false);
      }
    }
  });

  it("distinguishes The Cursed from cursed ordinary factions and keeps its modifier private", () => {
    const manifest = buildWorldTemplate(
      "world:sundered_isles/sundered_isles",
      worldId,
    );
    const resolve = (key: string, factionType: string, cursed: string) =>
      resolveFieldDefinition(domainField(manifest, key, 3), {
        entry: entry(
          manifest,
          "faction",
          { factionType, cursed },
          undefined,
          3,
        ),
        entries: {},
      });
    expect(domainField(manifest, "cursed", 3)).toMatchObject({
      type: "text",
      gmOnly: true,
      binding: null,
    });
    expect(resolve("cursedAspects", "Society", "No").visible).toBe(false);
    for (const factionType of [
      "Society",
      "Organization",
      "Empire",
      "Custom type",
    ]) {
      expect(resolve("cursedAspects", factionType, "Yes")).toMatchObject({
        visible: true,
        binding: {
          oracleId: "oracle_rollable:sundered_isles/faction/cursed/aspects",
        },
      });
    }
    expect(resolve("cursedAspects", "The Cursed", "No").visible).toBe(true);
    for (const key of ["methods", "secrets"]) {
      expect(resolve(key, "Organization", "Yes").visible).toBe(true);
      expect(resolve(key, "The Cursed", "Yes").visible).toBe(false);
    }
  });

  it("validates every seed binding against installed Datasworn packages", async () => {
    const oracleIds = new Set<string>();
    function visit(value: unknown) {
      if (!value || typeof value !== "object") return;
      if (
        "_id" in value &&
        typeof value._id === "string" &&
        value._id.startsWith("oracle_rollable:")
      )
        oracleIds.add(value._id);
      Object.values(value).forEach(visit);
    }
    for (const config of getOrderedPackageConfigs()) visit(await config.load());
    const bindings = settings.flatMap((setting) =>
      getWorldTemplateBindings(buildWorldTemplate(setting, worldId)),
    );
    expect(bindings.length).toBeGreaterThan(100);
    for (const binding of bindings) {
      expect(oracleIds.has(binding.oracleId), binding.oracleId).toBe(true);
      expect(binding.resolvedOracleId).toBe(binding.oracleId);
      expect(binding.packageId).toBe(
        binding.oracleId.split(":")[1].split("/")[0],
      );
    }
  }, 30000);

  it("pins the effective merged oracle as the concrete initial selection", () => {
    const target = "oracle_rollable:starsmith/character/goal";
    const manifest = buildWorldTemplate("world:starforged/forge", worldId, {
      "oracle_rollable:starforged/character/goal": target,
    });
    expect(
      manifest.categories[1].fields.find((field) => field.key === "goal")
        ?.binding,
    ).toEqual({
      packageId: "starsmith",
      oracleId: target,
      resolvedOracleId: target,
    });
  });

  it("has no Blank bindings, Delve defaults, Elegy type suggestions, or misleading Vault label", () => {
    expect(getWorldTemplateBindings(buildWorldTemplate(null, worldId))).toEqual(
      [],
    );
    expect(getWorldSettingPackageIds("sundered_isles")).toEqual([
      "starforged",
      "sundered_isles",
    ]);
    expect(getWorldSettingPackageIds(null)).toEqual([]);
    expect(
      buildWorldTemplate(null, worldId).categories.map(
        (category) => category.supports_bonds,
      ),
    ).toEqual([true, true, false]);
    expect(
      getWorldTemplateBindings(
        buildWorldTemplate("world:classic/ironlands", worldId),
      ).some((binding) => binding.packageId === "delve"),
    ).toBe(false);
    expect(
      domainField(
        buildWorldTemplate("world:elegy/santa_maria", worldId),
        "locationType",
      ).configuration.suggestions,
    ).toEqual([]);
    expect(
      domainField(
        buildWorldTemplate("world:starforged/forge", worldId),
        "derelictOuterFirstLook",
      ).label,
    ).toBe("Outer First Look");
    expect(
      getWorldSettingPackageIds("world:sundered_isles/sundered_isles"),
    ).toEqual(["starforged", "sundered_isles"]);
  });

  it("omits extra GM Notes from every setting and keeps a single conditional Forge Description", () => {
    for (const setting of settings) {
      expect(
        buildWorldTemplate(setting, worldId)
          .categories.flatMap((category) => category.fields)
          .some((field) => field.key === "gmNotes"),
      ).toBe(false);
    }
    const template = buildWorldTemplate("world:starforged/forge", worldId);
    const descriptions = template.categories[0].fields.filter(
      (field) => field.label === "Description",
    );
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toMatchObject({
      key: "starDescription",
      type: "oracleText",
      gm_only: false,
    });
    const definition = domainField(template, "starDescription");
    expect(
      resolveFieldDefinition(definition, {
        entry: entry(template, "planet", { locationType: "Planet" }),
        entries: {},
      }),
    ).toMatchObject({ visible: true, binding: null });
    expect(
      resolveFieldDefinition(definition, {
        entry: entry(template, "star", { locationType: "Star" }),
        entries: {},
      }),
    ).toMatchObject({
      visible: true,
      binding: { oracleId: "oracle_rollable:starforged/space/stellar_object" },
    });
    expect(
      resolveFieldDefinition(definition, {
        entry: entry(template, "sector", { locationType: "Sector" }),
        entries: {},
      }).visible,
    ).toBe(false);
    // Derelict Location remains a separate scalar because Type conditions read it.
    expect(domainField(template, "derelictLocation").type).toBe("text");
    expect(
      template.categories[0].fields.filter(
        (field) => field.label === "Location",
      ),
    ).toHaveLength(2);
  });

  it.each([
    [
      "world:starforged/forge",
      "settlementLocation",
      "Planetside Settlement",
      "starforged/settlement/location",
    ],
    [
      "world:starforged/forge",
      "settlementLocation",
      "Vault",
      "starforged/precursor_vault/location",
    ],
    [
      "world:starforged/forge",
      "derelictOuterFirstLook",
      "Derelict",
      "starforged/derelict/outer_first_look",
    ],
    [
      "world:starforged/forge",
      "derelictOuterFirstLook",
      "Vault",
      "starforged/precursor_vault/outer_first_look",
    ],
    [
      "world:sundered_isles/sundered_isles",
      "settlementLocation",
      "Shipwreck",
      "sundered_isles/shipwreck/location",
    ],
    [
      "world:sundered_isles/sundered_isles",
      "settlementLocation",
      "Ruin",
      "sundered_isles/ruin/location",
    ],
    [
      "world:sundered_isles/sundered_isles",
      "settlementFirstLook",
      "Ruin",
      "sundered_isles/ruin/first_look",
    ],
    [
      "world:sundered_isles/sundered_isles",
      "settlementDetails",
      "Shipwreck",
      "sundered_isles/shipwreck/details",
    ],
    [
      "world:sundered_isles/sundered_isles",
      "islandSize",
      "Island",
      "sundered_isles/island/landscape/size",
    ],
  ])("resolves merged %s %s for %s", (setting, key, locationType, oracle) => {
    const template = buildWorldTemplate(setting, worldId);
    expect(
      resolveFieldDefinition(domainField(template, key), {
        entry: entry(template, "entry", { locationType }),
        entries: {},
      }),
    ).toMatchObject({
      visible: true,
      binding: { oracleId: `oracle_rollable:${oracle}` },
    });
  });

  it("preserves regional settlement Size resolution and its editable fallback after merging", () => {
    const template = buildWorldTemplate(
      "world:sundered_isles/sundered_isles",
      worldId,
    );
    const area = entry(template, "area", {
      locationType: "Area",
      region: "Reaches",
    });
    const settlement = entry(
      template,
      "settlement",
      { locationType: "Settlement" },
      "area",
    );
    const size = domainField(template, "islandSize");
    expect(
      resolveFieldDefinition(size, { entry: settlement, entries: { area } }),
    ).toMatchObject({
      visible: true,
      binding: {
        oracleId: "oracle_rollable:sundered_isles/settlement/size/reaches",
      },
    });
    expect(
      resolveFieldDefinition(size, { entry: settlement, entries: {} }),
    ).toMatchObject({ visible: true, binding: null });
    for (const label of ["Location", "First Look", "Details", "Size"]) {
      expect(
        template.categories[0].fields.filter((field) => field.label === label),
      ).toHaveLength(1);
    }
  });

  it("resolves Forge class and nearest Sector region; Void and missing inputs stay editable", () => {
    const template = buildWorldTemplate("world:starforged/forge", worldId);
    const outer = entry(template, "outer", {
      locationType: "Sector",
      region: "Terminus",
    });
    const inner = entry(
      template,
      "inner",
      { locationType: "Sector", region: "Outlands" },
      "outer",
    );
    const planet = entry(
      template,
      "planet",
      { locationType: "Planet", planetClass: "Desert World" },
      "inner",
    );
    const snapshot = { entry: planet, entries: { outer, inner } };
    const definition = domainField(template, "planetSettlements");
    expect(resolveFieldDefinition(definition, snapshot).binding?.oracleId).toBe(
      "oracle_rollable:starforged/planet/desert/settlements/outlands",
    );
    inner.values = {
      ...inner.values,
      [domainField(template, "region").id]: "Void",
    };
    expect(resolveFieldDefinition(definition, snapshot)).toMatchObject({
      visible: true,
      binding: null,
    });
    expect(
      resolveFieldDefinition(definition, {
        entry: { ...planet, parentId: null },
        entries: {},
      }),
    ).toMatchObject({ visible: true, binding: null });
    expect(
      resolveFieldDefinition(domainField(template, "region"), snapshot).visible,
    ).toBe(false);
  });

  it("takes regional SI bindings from the nearest Area and has an unbound visible fallback", () => {
    const template = buildWorldTemplate(
      "world:sundered_isles/sundered_isles",
      worldId,
    );
    const outer = entry(template, "outer", {
      locationType: "Area",
      region: "Myriads",
    });
    const inner = entry(
      template,
      "inner",
      { locationType: "Area", region: "Reaches" },
      "outer",
    );
    const island = entry(
      template,
      "island",
      { locationType: "Island" },
      "inner",
    );
    const definition = domainField(template, "islandVitality");
    expect(
      resolveFieldDefinition(definition, {
        entry: island,
        entries: { inner, outer },
      }).binding?.oracleId,
    ).toBe("oracle_rollable:sundered_isles/island/landscape/vitality/reaches");
    expect(
      resolveFieldDefinition(definition, { entry: island, entries: {} }),
    ).toMatchObject({ visible: true, binding: null });
    expect(
      resolveFieldDefinition(domainField(template, "region"), {
        entry: island,
        entries: {},
      }).visible,
    ).toBe(false);
  });
});
