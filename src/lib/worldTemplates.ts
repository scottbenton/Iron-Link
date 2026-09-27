import { v5 as uuid } from "uuid";

import { IconColors } from "types/Icon.type";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { forgeLocations, forgeNpcs } from "./worldTemplates/forge";
import {
  elegyLocations,
  elegyNpcs,
  ironlandsLocations,
  ironlandsNpcs,
  islesLocations,
  islesNpcs,
} from "./worldTemplates/otherSettings";
import {
  type TemplateField,
  type WorldTemplateManifest,
  field,
  pronouns,
  tags,
} from "./worldTemplates/shared";

export type {
  WorldTemplateManifest,
  WorldTemplateCategory,
  WorldTemplateField,
} from "./worldTemplates/shared";

export function getWorldSettingPackageIds(settingKey: string | null): string[] {
  const packageId = settingKey?.includes(":")
    ? settingKey.split(":")[1]?.split("/")[0]
    : settingKey;
  if (!packageId) return [];
  return packageId === "sundered_isles"
    ? ["starforged", "sundered_isles"]
    : [packageId];
}

/** Defaults are rebuilt from code with identities stable for the lifetime of a world. */
export function buildWorldTemplate(
  settingKey: string | null,
  worldId: string,
  replacementMap: Record<string, string> = {},
): WorldTemplateManifest {
  let locations: TemplateField[] = [
    field("locationType", "Location Type"),
    tags(),
  ];
  let npcs: TemplateField[] = [pronouns(), tags()];
  switch (settingKey) {
    case "world:classic/ironlands":
      locations = ironlandsLocations();
      npcs = ironlandsNpcs();
      break;
    case "world:starforged/forge":
      locations = forgeLocations();
      npcs = forgeNpcs();
      break;
    case "world:sundered_isles/sundered_isles":
      locations = islesLocations();
      npcs = islesNpcs();
      break;
    case "world:elegy/santa_maria":
      locations = elegyLocations();
      npcs = elegyNpcs();
      break;
  }
  const pinBinding = (binding: OracleBinding | null): OracleBinding | null => {
    if (!binding) return null;
    const oracleId = binding.exact
      ? binding.oracleId
      : (replacementMap[binding.oracleId] ?? binding.oracleId);
    return {
      ...binding,
      oracleId,
      resolvedOracleId: oracleId,
      packageId: oracleId.split(":")[1].split("/")[0],
    };
  };
  return {
    version: 1,
    categories: [
      {
        key: "locations",
        name: "Locations",
        icon: { key: "GiCompass", color: IconColors.Green },
        fields: locations,
      },
      {
        key: "npcs",
        name: "NPCs",
        icon: { key: "GiPerson", color: IconColors.Blue },
        fields: npcs,
      },
      {
        key: "lore",
        name: "Lore",
        icon: { key: "GiBookCover", color: IconColors.Purple },
        fields: [tags()],
      },
    ].map((category, categoryIndex) => {
      const ids = Object.fromEntries(
        category.fields.map((definition) => [
          definition.key,
          uuid(`field:${category.key}:${definition.key}`, worldId),
        ]),
      );
      const resolveReference = (key: string) => {
        if (!ids[key]) throw new Error(`Unknown template field: ${key}`);
        return ids[key];
      };
      return {
        id: uuid(`category:${category.key}`, worldId),
        name: category.name,
        icon: category.icon,
        sort_order: categoryIndex,
        supports_hierarchy: categoryIndex === 0,
        supports_map: categoryIndex === 0,
        supports_bonds: categoryIndex !== 2,
        subtitle_field_definition_id:
          categoryIndex === 0 ? ids.locationType : null,
        fields: category.fields.map((definition, index) => ({
          ...definition,
          id: ids[definition.key],
          sort_order: index,
          binding: pinBinding(definition.binding),
          configuration: {
            ...definition.configuration,
            rules: definition.configuration.rules.map((rule) => ({
              ...rule,
              ...(rule.binding === undefined
                ? {}
                : { binding: pinBinding(rule.binding) }),
              conditions: rule.conditions.map((condition) => ({
                ...condition,
                fieldId: resolveReference(condition.fieldId),
                ...(condition.ancestor
                  ? {
                      ancestor: {
                        ...condition.ancestor,
                        fieldId: resolveReference(condition.ancestor.fieldId),
                      },
                    }
                  : {}),
              })),
            })),
          },
        })),
      };
    }),
  };
}

export function getWorldTemplateBindings(
  manifest: WorldTemplateManifest,
): OracleBinding[] {
  return manifest.categories.flatMap((category) =>
    category.fields.flatMap((definition) =>
      [
        definition.binding,
        ...definition.configuration.rules.map((rule) => rule.binding),
      ].filter((candidate): candidate is OracleBinding => candidate != null),
    ),
  );
}
