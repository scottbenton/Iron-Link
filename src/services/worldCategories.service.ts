import { v4 as uuid } from "uuid";

import { IconDefinition } from "types/Icon.type";
import { Json } from "types/supabase-generated.type";

import { WorldCategoriesRepository } from "repositories/worldCategories.repository";
import type { WorldConfigurationCategoryDTO } from "repositories/worldConfiguration.repository";

import {
  IWorldFieldDefinition,
  WorldFieldDefinitionsService,
} from "./worldFieldDefinitions.service";

export interface IWorldCategory {
  id: string;
  worldId: string;
  name: string;
  icon: IconDefinition | null;
  sortOrder: number;
  supportsHierarchy: boolean;
  supportsMap: boolean;
  supportsBonds: boolean;
  // Field whose value renders as secondary content under the entry name in
  // list views. Null means the list shows names only.
  subtitleFieldDefinitionId: string | null;
  // Fields shown instead of the subtitle field for entries whose subtitle
  // field holds `value` (trimmed, ignoring case): a Sector's Region. They
  // apply only while the subtitle field is a single-choice option list.
  subtitleOverrides: IWorldCategorySubtitleOverride[];
}

export interface IWorldCategorySubtitleOverride {
  value: string;
  fieldDefinitionId: string;
}

export class WorldCategoriesService {
  public static async addWorldCategory(
    worldId: string,
    category: {
      name: string;
      icon?: IconDefinition;
      sortOrder: number;
      supportsHierarchy?: boolean;
      supportsMap?: boolean;
      supportsBonds?: boolean;
    },
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<string> {
    const id = uuid();
    await WorldCategoriesRepository.addWorldCategory(
      worldId,
      {
        id,
        name: category.name,
        icon: (category.icon ?? null) as unknown as Json,
        sort_order: category.sortOrder,
        supports_hierarchy: category.supportsHierarchy ?? false,
        supports_map: category.supportsMap ?? false,
        supports_bonds: category.supportsBonds ?? false,
      },
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO(
        inheritedFieldDefinitions,
      ),
    );
    return id;
  }

  public static updateWorldCategory(
    worldId: string,
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<void> {
    return WorldCategoriesRepository.updateWorldCategory(
      worldId,
      categoryId,
      {
        name: category.name,
        icon:
          category.icon === undefined
            ? undefined
            : (category.icon as unknown as Json),
        sort_order: category.sortOrder,
        supports_hierarchy: category.supportsHierarchy,
        supports_map: category.supportsMap,
        supports_bonds: category.supportsBonds,
        subtitle_field_definition_id: category.subtitleFieldDefinitionId,
        subtitle_overrides:
          category.subtitleOverrides === undefined
            ? undefined
            : category.subtitleOverrides.map((override) => ({
                value: override.value,
                field_definition_id: override.fieldDefinitionId,
              })),
      },
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO(
        inheritedFieldDefinitions,
      ),
    );
  }

  public static deleteWorldCategory(
    worldId: string,
    categoryId: string,
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<void> {
    return WorldCategoriesRepository.deleteWorldCategory(
      worldId,
      categoryId,
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO(
        inheritedFieldDefinitions,
      ),
    );
  }

  public static reorderWorldCategories(
    worldId: string,
    categoryIds: string[],
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<void> {
    return WorldCategoriesRepository.reorderWorldCategories(
      worldId,
      categoryIds,
      WorldFieldDefinitionsService.convertInheritedBindingsToDTO(
        inheritedFieldDefinitions,
      ),
    );
  }

  public static convertWorldCategoryDTOToWorldCategory(
    category: WorldConfigurationCategoryDTO,
  ): IWorldCategory {
    return {
      id: category.id,
      worldId: category.world_id,
      name: category.name,
      icon: (category.icon as unknown as IconDefinition) ?? null,
      sortOrder: category.sort_order,
      supportsHierarchy: category.supports_hierarchy,
      supportsMap: category.supports_map,
      supportsBonds: category.supports_bonds,
      subtitleFieldDefinitionId: category.subtitle_field_definition_id,
      subtitleOverrides: parseSubtitleOverrides(category.subtitle_overrides),
    };
  }
}

// Stored as { value, field_definition_id } objects; anything else is skipped
// so an unexpected row never breaks the category.
function parseSubtitleOverrides(
  value: Json | undefined,
): IWorldCategorySubtitleOverride[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { value: overrideValue, field_definition_id: fieldDefinitionId } =
      item;
    return typeof overrideValue === "string" &&
      typeof fieldDefinitionId === "string"
      ? [{ value: overrideValue, fieldDefinitionId }]
      : [];
  });
}
