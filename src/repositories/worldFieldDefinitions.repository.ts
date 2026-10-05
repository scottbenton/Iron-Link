import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";
import type { OracleBinding } from "types/worldField.type";

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

export type OracleBindingDTO = OracleBinding;

export type WorldFieldDefinitionDTO = Tables<"world_field_definitions">;
export type WorldFieldDefinitionInsertDTO =
  TablesInsert<"world_field_definitions">;
export type WorldFieldDefinitionUpdateDTO =
  TablesUpdate<"world_field_definitions">;

export class WorldFieldDefinitionsRepository {
  private static worldFieldDefinitions = () =>
    supabase.from("world_field_definitions");

  // Definitions are the world's shape rather than its content, so they load
  // per world alongside categories, not per entry like values do.
  public static listenToWorldFieldDefinitions(
    worldId: string,
    onDefinitionChanges: (
      changedDefinitions: Record<string, WorldFieldDefinitionDTO>,
      removedDefinitionIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createCollectionSubscription(
      `world_field_definitions:world_id=eq.${worldId}`,
      "world_field_definitions",
      `world_id=eq.${worldId}`,
      async () => {
        const { data, error, status } = await this.worldFieldDefinitions()
          .select("*")
          .eq("world_id", worldId);
        if (error) {
          throw getRepositoryError(
            error,
            ErrorVerb.Read,
            ErrorNoun.WorldFieldDefinition,
            true,
            status,
          );
        }
        return data;
      },
      onDefinitionChanges,
      onError,
      ErrorNoun.WorldFieldDefinition,
    );
  }

  public static async addWorldFieldDefinition(
    definition: WorldFieldDefinitionInsertDTO & { id: string },
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<string> {
    const { world_id: worldId, category_id: categoryId, ...field } = definition;
    await mutateWorldConfiguration(
      worldId,
      { type: "create_field", category_id: categoryId, field },
      defaultBindings,
    );
    return definition.id;
  }

  public static updateWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    definition: WorldFieldDefinitionUpdateDTO,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "update_field", id: definitionId, changes: definition },
      defaultBindings,
    );
  }

  public static deleteWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return mutateWorldConfiguration(
      worldId,
      { type: "delete_field", id: definitionId },
      defaultBindings,
    );
  }
}
