import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

// JSON shape stored in world_categories.field_definitions.
// Bindings are pinned and concrete: the picker browses the world's effective
// playset with `replaces` applied, so what the user picked is what is stored.
export interface OracleBindingDTO {
  packageId: string;
  oracleId: string;
  // What the binding actually resolved to last time; a difference against a
  // fresh resolution is a divergence and must be surfaced, never silent.
  resolvedOracleId: string;
  // Escape hatch: ignore replacements, always roll exactly oracleId.
  exact?: boolean;
}

export type FieldDefinitionType =
  | "text"
  | "richText"
  | "oracleText"
  | "image"
  | "tags";

export interface FieldDefinitionDTO {
  key: string;
  label: string;
  type: FieldDefinitionType;
  binding?: OracleBindingDTO;
  // Value lives in world_entry_gm_data, RLS-protected.
  gmOnly?: boolean;
}

export type WorldCategoryDTO = Tables<"world_categories">;
export type WorldCategoryInsertDTO = TablesInsert<"world_categories">;
export type WorldCategoryUpdateDTO = TablesUpdate<"world_categories">;

export class WorldCategoriesRepository {
  private static worldCategories = () => supabase.from("world_categories");

  public static listenToWorldCategories(
    worldId: string,
    onWorldCategoryChanges: (
      changedCategories: Record<string, WorldCategoryDTO>,
      removedCategoryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      this.worldCategories()
        .select("*")
        .eq("world_id", worldId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldCategory,
                true,
                status,
              ),
            );
          } else {
            onWorldCategoryChanges(
              Object.fromEntries(
                data.map((category) => [category.id, category]),
              ),
              [],
              true,
            );
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldCategoryDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldCategory,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onWorldCategoryChanges({ [payload.new.id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        onWorldCategoryChanges({}, [payload.old.id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_categories:world_id=eq.${worldId}`,
      "world_categories",
      `world_id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static addWorldCategory(
    category: WorldCategoryInsertDTO,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.worldCategories()
        .insert(category)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldCategory,
                false,
                status,
              ),
            );
          } else {
            resolve(data.id);
          }
        });
    });
  }

  public static updateWorldCategory(
    categoryId: string,
    category: WorldCategoryUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldCategories()
        .update(category)
        .eq("id", categoryId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldCategory,
                false,
                status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static deleteWorldCategory(categoryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldCategories()
        .delete()
        .eq("id", categoryId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldCategory,
                false,
                status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }
}
