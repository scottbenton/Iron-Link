import { IconDefinition } from "types/Icon.type";
import { Json } from "types/supabase-generated.type";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  FieldDefinitionDTO,
  OracleBindingDTO,
  WorldCategoriesRepository,
  WorldCategoryDTO,
} from "repositories/worldCategories.repository";

// The stored JSON already uses the domain shape (see the repository DTOs),
// so the domain types are aliases rather than conversions.
export type FieldDefinition = FieldDefinitionDTO;
export type OracleBinding = OracleBindingDTO;

export interface IWorldCategory {
  id: string;
  worldId: string;
  name: string;
  icon: IconDefinition | null;
  sortOrder: number;
  supportsHierarchy: boolean;
  supportsMap: boolean;
  supportsBonds: boolean;
  fieldDefinitions: FieldDefinition[];
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
      fieldDefinitions?: FieldDefinition[];
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
      field_definitions: (category.fieldDefinitions ?? []) as unknown as Json,
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
      field_definitions:
        category.fieldDefinitions === undefined
          ? undefined
          : (category.fieldDefinitions as unknown as Json),
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
      fieldDefinitions: Array.isArray(category.field_definitions)
        ? (category.field_definitions as unknown as FieldDefinition[])
        : [],
    };
  }
}
