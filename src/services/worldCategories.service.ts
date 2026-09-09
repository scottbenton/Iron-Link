import { IconDefinition } from "types/Icon.type";
import { Json } from "types/supabase-generated.type";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldCategoriesRepository,
  WorldCategoryDTO,
} from "repositories/worldCategories.repository";

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
  public static listenToWorldCategories(
    worldId: string,
    onWorldCategoryChanges: (
      changedCategories: Record<string, IWorldCategory>,
      removedCategoryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldCategoriesRepository.listenToWorldCategories(
      worldId,
      (changedCategories, removedCategoryIds, replaceState) =>
        onWorldCategoryChanges(
          Object.fromEntries(
            Object.entries(changedCategories).map(([categoryId, category]) => [
              categoryId,
              this.convertWorldCategoryDTOToWorldCategory(category),
            ]),
          ),
          removedCategoryIds,
          replaceState,
        ),
      onError,
    );
  }

  public static addWorldCategory(
    worldId: string,
    category: {
      name: string;
      icon?: IconDefinition;
      sortOrder: number;
      supportsHierarchy?: boolean;
      supportsMap?: boolean;
      supportsBonds?: boolean;
    },
  ): Promise<string> {
    return WorldCategoriesRepository.addWorldCategory({
      world_id: worldId,
      name: category.name,
      icon: (category.icon ?? null) as unknown as Json,
      sort_order: category.sortOrder,
      supports_hierarchy: category.supportsHierarchy ?? false,
      supports_map: category.supportsMap ?? false,
      supports_bonds: category.supportsBonds ?? false,
    });
  }

  public static updateWorldCategory(
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
  ): Promise<void> {
    return WorldCategoriesRepository.updateWorldCategory(categoryId, {
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
    });
  }

  public static deleteWorldCategory(categoryId: string): Promise<void> {
    return WorldCategoriesRepository.deleteWorldCategory(categoryId);
  }

  private static convertWorldCategoryDTOToWorldCategory(
    category: WorldCategoryDTO,
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
