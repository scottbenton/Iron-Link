import { v4 as uuid } from "uuid";

import { IconDefinition } from "types/Icon.type";
import { Json } from "types/supabase-generated.type";

import { WorldCategoriesRepository } from "repositories/worldCategories.repository";
import type {
  DefaultWorldFieldBinding,
  WorldConfigurationCategoryDTO,
} from "repositories/worldConfiguration.repository";

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
    defaultBindings?: DefaultWorldFieldBinding[],
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
      defaultBindings,
    );
    return id;
  }

  public static updateWorldCategory(
    worldId: string,
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
    defaultBindings?: DefaultWorldFieldBinding[],
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
      },
      defaultBindings,
    );
  }

  public static deleteWorldCategory(
    worldId: string,
    categoryId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldCategoriesRepository.deleteWorldCategory(
      worldId,
      categoryId,
      defaultBindings,
    );
  }

  public static reorderWorldCategories(
    worldId: string,
    categoryIds: string[],
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldCategoriesRepository.reorderWorldCategories(
      worldId,
      categoryIds,
      defaultBindings,
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
    };
  }
}
