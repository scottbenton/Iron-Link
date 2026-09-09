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

// JSON shape stored in world_field_definitions.binding.
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
    const startInitialLoad = () => {
      this.worldFieldDefinitions()
        .select("*")
        .eq("world_id", worldId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldFieldDefinition,
                true,
                status,
              ),
            );
          } else {
            onDefinitionChanges(
              Object.fromEntries(
                data.map((definition) => [definition.id, definition]),
              ),
              [],
              true,
            );
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldFieldDefinitionDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldFieldDefinition,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onDefinitionChanges({ [payload.new.id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        onDefinitionChanges({}, [payload.old.id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_field_definitions:world_id=eq.${worldId}`,
      "world_field_definitions",
      `world_id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static addWorldFieldDefinition(
    definition: WorldFieldDefinitionInsertDTO,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.worldFieldDefinitions()
        .insert(definition)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldFieldDefinition,
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

  // Flipping gm_only here is all that is needed to move existing values across
  // the RLS boundary: a trigger propagates the new value to every value row
  // for this definition in the same statement.
  public static updateWorldFieldDefinition(
    definitionId: string,
    definition: WorldFieldDefinitionUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldFieldDefinitions()
        .update(definition)
        .eq("id", definitionId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldFieldDefinition,
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

  // Cascades to every value row for this definition.
  public static deleteWorldFieldDefinition(
    definitionId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldFieldDefinitions()
        .delete()
        .eq("id", definitionId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldFieldDefinition,
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
