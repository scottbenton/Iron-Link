import { v4 as uuid } from "uuid";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createCollectionSubscription } from "./_collectionSubscription";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import {
  type DefaultWorldFieldBinding,
  mutateWorldConfiguration,
} from "./worldConfiguration.repository";

export type WorldCategoryDTO = Tables<"world_categories">;
export type WorldCategoryInsertDTO = TablesInsert<"world_categories">;
export type WorldCategoryUpdateDTO = TablesUpdate<"world_categories">;

export class WorldCategoriesRepository {
  private static worldCategories = () => supabase.from("world_categories");

  public static reorderCategories(
    worldId: string,
    ids: string[],
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "reorder_categories", ids },
      defaultBindings,
    );
  }

  public static reorderFields(
    worldId: string,
    categoryId: string,
    ids: string[],
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "reorder_fields", category_id: categoryId, ids },
      defaultBindings,
    );
  }

  public static async getCategoryCounts(
    worldId: string,
    categoryId: string,
  ): Promise<{
    entryCount: number;
    valueCounts: Record<string, number>;
  }> {
    const { data, error, status } = await supabase.rpc(
      "get_world_category_counts",
      {
        p_world_id: worldId,
        p_category_id: categoryId,
      },
    );
    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.WorldCategory,
        false,
        status,
      );
    }
    const counts = data as {
      entryCount: number;
      valueCounts: Record<string, number>;
    };
    return {
      entryCount: counts.entryCount,
      valueCounts: counts.valueCounts ?? {},
    };
  }

  public static listenToWorldCategories(
    worldId: string,
    onWorldCategoryChanges: (
      changedCategories: Record<string, WorldCategoryDTO>,
      removedCategoryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createCollectionSubscription(
      `world_categories:world_id=eq.${worldId}`,
      "world_categories",
      `world_id=eq.${worldId}`,
      async () => {
        const { data, error, status } = await this.worldCategories()
          .select("*")
          .eq("world_id", worldId);
        if (error) {
          throw getRepositoryError(
            error,
            ErrorVerb.Read,
            ErrorNoun.WorldCategory,
            true,
            status,
          );
        }
        return data;
      },
      onWorldCategoryChanges,
      onError,
      ErrorNoun.WorldCategory,
    );
  }

  public static async addWorldCategory(
    category: WorldCategoryInsertDTO,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<string> {
    const { world_id: worldId, ...configuration } = category;
    const id = category.id ?? uuid();
    await mutateWorldConfiguration(
      worldId,
      { type: "create_category", category: { ...configuration, id } },
      defaultBindings,
    );
    return id;
  }

  public static updateWorldCategory(
    worldId: string,
    categoryId: string,
    category: WorldCategoryUpdateDTO,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "update_category", id: categoryId, changes: category },
      defaultBindings,
    );
  }

  public static deleteWorldCategory(
    worldId: string,
    categoryId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "delete_category", id: categoryId },
      defaultBindings,
    );
  }
}
