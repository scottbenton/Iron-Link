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

export type WorldEntryGmDataDTO = Tables<"world_entry_gm_data">;
export type WorldEntryGmDataInsertDTO = TablesInsert<"world_entry_gm_data">;

// RLS restricts every operation on this table to owner/editor/guide roles;
// callers should only listen when the user has GM-equivalent access.
export class WorldEntryGmDataRepository {
  private static worldEntryGmData = () => supabase.from("world_entry_gm_data");

  public static listenToWorldEntryGmData(
    worldId: string,
    onGmDataChanges: (
      changedGmData: Record<string, WorldEntryGmDataDTO>,
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      // gm_notes_content is a large Yjs byte column fetched on demand
      this.worldEntryGmData()
        .select("entry_id, world_id, fields, created_at, updated_at")
        .eq("world_id", worldId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldEntries,
                true,
                status,
              ),
            );
          } else {
            onGmDataChanges(
              Object.fromEntries(
                data.map((row) => [
                  row.entry_id,
                  row as unknown as WorldEntryGmDataDTO,
                ]),
              ),
              [],
              true,
            );
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldEntryGmDataDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldEntries,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onGmDataChanges({ [payload.new.entry_id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.entry_id) {
        onGmDataChanges({}, [payload.old.entry_id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_entry_gm_data:world_id=eq.${worldId}`,
      "world_entry_gm_data",
      `world_id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  // Returns null when the entry has no GM data row yet.
  public static getWorldEntryGmNotesContent(
    entryId: string,
  ): Promise<WorldEntryGmDataDTO | null> {
    return new Promise((resolve, reject) => {
      this.worldEntryGmData()
        .select("gm_notes_content")
        .eq("entry_id", entryId)
        .maybeSingle()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldEntries,
                false,
                status,
              ),
            );
          } else {
            resolve(data as WorldEntryGmDataDTO | null);
          }
        });
    });
  }

  public static upsertWorldEntryGmData(
    gmData: WorldEntryGmDataInsertDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldEntryGmData()
        .upsert(gmData, { onConflict: "entry_id" })
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldEntries,
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
