import { createWorldFieldConfiguration } from "lib/worldFieldRules";

import { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

export const category: IWorldCategory = {
  id: "category-1",
  worldId: "world-1",
  name: "Locations",
  icon: null,
  sortOrder: 0,
  supportsHierarchy: true,
  supportsMap: false,
  supportsBonds: false,
  subtitleFieldDefinitionId: null,
};

export function field(
  overrides: Partial<IWorldFieldDefinition> = {},
): IWorldFieldDefinition {
  return {
    id: "aaaaaaaa-0000-4000-8000-000000000000",
    categoryId: category.id,
    worldId: category.worldId,
    key: "existing-key",
    label: "Description",
    type: WorldFieldType.Text,
    binding: null,
    gmOnly: false,
    sortOrder: 0,
    configuration: createWorldFieldConfiguration(),
    ...overrides,
  };
}

export function translate(
  _key: string,
  fallback: string,
  options?: Record<string, unknown>,
) {
  return fallback.replace(/{{(\w+)}}/g, (_, key: string) =>
    String(options?.[key] ?? ""),
  );
}
