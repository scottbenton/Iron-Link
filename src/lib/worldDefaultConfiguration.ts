import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { buildWorldTemplate } from "./worldTemplates";

/** Fresh objects keep editor drafts and replacement resolution out of shared defaults. */
export function getWorldDefaultConfiguration(
  worldId: string,
  settingKey: string | null,
  replacementMap: Record<string, string> = {},
): {
  categories: Record<string, IWorldCategory>;
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
} {
  const template = buildWorldTemplate(settingKey, worldId, replacementMap);
  return {
    categories: Object.fromEntries(
      template.categories.map((category) => [
        category.id,
        {
          id: category.id,
          worldId,
          name: category.name,
          icon: category.icon,
          sortOrder: category.sort_order,
          supportsHierarchy: category.supports_hierarchy,
          supportsMap: category.supports_map,
          supportsBonds: category.supports_bonds,
          subtitleFieldDefinitionId: category.subtitle_field_definition_id,
        },
      ]),
    ),
    fieldDefinitions: Object.fromEntries(
      template.categories.flatMap((category) =>
        category.fields.map((field) => [
          field.id,
          {
            id: field.id,
            worldId,
            categoryId: category.id,
            key: field.key,
            label: field.label,
            type: field.type,
            binding: field.binding,
            configuration: field.configuration,
            gmOnly: field.gm_only,
            sortOrder: field.sort_order,
          },
        ]),
      ),
    ),
  };
}
