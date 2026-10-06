import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { ErrorNoun } from "./errors/RepositoryErrors";
import {
  type DefaultWorldFieldBinding,
  WorldConfigurationRepository,
} from "./worldConfiguration.repository";

export type WorldCategoryDTO = Tables<"world_categories">;
export type WorldCategoryInsertDTO = TablesInsert<"world_categories">;
export type WorldCategoryUpdateDTO = TablesUpdate<"world_categories">;

// Categories are read as part of the world configuration. Every edit goes
// through the configuration RPC so the first one can fork inherited defaults.
export class WorldCategoriesRepository {
  public static addWorldCategory(
    worldId: string,
    category: Omit<WorldCategoryInsertDTO, "world_id"> & { id: string },
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      {
        type: "create_category",
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon ?? null,
          sort_order: category.sort_order ?? 0,
          supports_hierarchy: category.supports_hierarchy ?? false,
          supports_map: category.supports_map ?? false,
          supports_bonds: category.supports_bonds ?? false,
          subtitle_field_definition_id:
            category.subtitle_field_definition_id ?? null,
        },
      },
      ErrorNoun.WorldCategory,
      defaultBindings,
    );
  }

  public static updateWorldCategory(
    worldId: string,
    categoryId: string,
    category: WorldCategoryUpdateDTO,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "update_category", id: categoryId, changes: category },
      ErrorNoun.WorldCategory,
      defaultBindings,
    );
  }

  // Cascades through the category's field definitions. The database rejects
  // deleting a category that still has entries.
  public static deleteWorldCategory(
    worldId: string,
    categoryId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "delete_category", id: categoryId },
      ErrorNoun.WorldCategory,
      defaultBindings,
    );
  }

  public static reorderWorldCategories(
    worldId: string,
    categoryIds: string[],
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "reorder_categories", ids: categoryIds },
      ErrorNoun.WorldCategory,
      defaultBindings,
    );
  }
}
