import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables, TablesInsert } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type WorldEntryFieldValueDTO = Tables<"world_entry_field_values">;
export type WorldEntryFieldValueInsertDTO =
  TablesInsert<"world_entry_field_values">;

// `content` holds richText/oracleText Yjs documents and is fetched on demand,
// exactly as notes_content is on the entry itself.
const VALUE_LIST_COLUMNS =
  "entry_id, field_definition_id, world_id, gm_only, value, created_at, updated_at";

// RLS hides gm_only rows from anyone below guide and gates writes on the parent
// entry's edit_permissions, so nothing here needs to re-check either.
export class WorldEntryFieldValuesRepository {
  private static worldEntryFieldValues = () =>
    supabase.from("world_entry_field_values");

  // Scoped to a single entry on purpose: subscribing per world would stream
  // every field of every entry to every client.
  public static listenToWorldEntryFieldValues(
    entryId: string,
    onValueChanges: (
      changedValues: Record<string, WorldEntryFieldValueDTO>,
      removedFieldDefinitionIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      this.worldEntryFieldValues()
        .select(VALUE_LIST_COLUMNS)
        .eq("entry_id", entryId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldEntryFieldValue,
                true,
                status,
              ),
            );
          } else {
            onValueChanges(
              Object.fromEntries(
                data.map((value) => [
                  value.field_definition_id,
                  value as unknown as WorldEntryFieldValueDTO,
                ]),
              ),
              [],
              true,
            );
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldEntryFieldValueDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldEntryFieldValue,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onValueChanges(
          { [payload.new.field_definition_id]: payload.new },
          [],
          false,
        );
      } else if (
        payload.eventType === "DELETE" &&
        payload.old.field_definition_id
      ) {
        onValueChanges({}, [payload.old.field_definition_id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_entry_field_values:entry_id=eq.${entryId}`,
      "world_entry_field_values",
      `entry_id=eq.${entryId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  // gm_only is deliberately absent from the payload: a trigger sets it from the
  // field definition, and a client-supplied value would be overruled anyway.
  public static upsertWorldEntryFieldValue(
    value: WorldEntryFieldValueInsertDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldEntryFieldValues()
        .upsert(value, { onConflict: "entry_id,field_definition_id" })
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldEntryFieldValue,
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

  // Returns null when the entry has no value row for this field yet.
  public static getWorldEntryFieldValueContent(
    entryId: string,
    fieldDefinitionId: string,
  ): Promise<WorldEntryFieldValueDTO | null> {
    return new Promise((resolve, reject) => {
      this.worldEntryFieldValues()
        .select("content")
        .eq("entry_id", entryId)
        .eq("field_definition_id", fieldDefinitionId)
        .maybeSingle()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldEntryFieldValue,
                false,
                status,
              ),
            );
          } else {
            resolve(data as WorldEntryFieldValueDTO | null);
          }
        });
    });
  }

  public static deleteWorldEntryFieldValue(
    entryId: string,
    fieldDefinitionId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldEntryFieldValues()
        .delete()
        .eq("entry_id", entryId)
        .eq("field_definition_id", fieldDefinitionId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldEntryFieldValue,
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
