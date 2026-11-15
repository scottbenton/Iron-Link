import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  RepositoryError,
  createRepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type WorldMapDTO = Tables<"world_maps">;
export type WorldMapInsertDTO = TablesInsert<"world_maps">;
export type WorldMapUpdateDTO = TablesUpdate<"world_maps">;
export type WorldMapChunkDTO = Tables<"world_map_chunks">;
export type WorldMapPinDTO = Tables<"world_map_pins">;

// A map, its painted chunks and its pins each have their own realtime
// subscription, filtered to the one entry. RLS filters every initial read and
// every event, so a reader never receives a pin for an entry they cannot see.
export class WorldMapsRepository {
  private static maps = () => supabase.from("world_maps");
  private static chunks = () => supabase.from("world_map_chunks");
  private static pins = () => supabase.from("world_map_pins");

  public static listenToWorldMap(
    entryId: string,
    onMap: (map: WorldMapDTO | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<WorldMapDTO>(
      `world_maps:entry_id=eq.${entryId}`,
      "world_maps",
      `entry_id=eq.${entryId}`,
      (isCurrent) => {
        this.maps()
          .select()
          .eq("entry_id", entryId)
          .maybeSingle()
          .then(({ data, error, status }) => {
            if (!isCurrent()) return;
            if (error) {
              console.error(error);
              onError(
                getRepositoryError(
                  error,
                  ErrorVerb.Read,
                  ErrorNoun.WorldMap,
                  false,
                  status,
                ),
              );
            } else {
              onMap(data);
            }
          });
      },
      (payload: RealtimePostgresChangesPayload<WorldMapDTO>) => {
        if (payload.eventType === "DELETE") onMap(null);
        else onMap(payload.new);
      },
      { loadBeforeJoin: true },
    );
  }

  public static listenToWorldMapChunks(
    entryId: string,
    onChunks: (chunks: WorldMapChunkDTO[], replaceState: boolean) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<WorldMapChunkDTO>(
      `world_map_chunks:entry_id=eq.${entryId}`,
      "world_map_chunks",
      `entry_id=eq.${entryId}`,
      (isCurrent) => {
        this.chunks()
          .select()
          .eq("entry_id", entryId)
          .then(({ data, error, status }) => {
            if (!isCurrent()) return;
            if (error) {
              console.error(error);
              onError(
                getRepositoryError(
                  error,
                  ErrorVerb.Read,
                  ErrorNoun.WorldMap,
                  false,
                  status,
                ),
              );
            } else {
              onChunks(data, true);
            }
          });
      },
      (payload: RealtimePostgresChangesPayload<WorldMapChunkDTO>) => {
        // Chunks are never deleted on their own (clearing writes no cells),
        // only with their map.
        if (
          (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
          payload.new.entry_id === entryId
        )
          onChunks([payload.new], false);
      },
      { loadBeforeJoin: true },
    );
  }

  public static listenToWorldMapPins(
    entryId: string,
    onPins: (
      changed: WorldMapPinDTO[],
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<WorldMapPinDTO>(
      `world_map_pins:entry_id=eq.${entryId}`,
      "world_map_pins",
      `entry_id=eq.${entryId}`,
      (isCurrent) => {
        this.pins()
          .select()
          .eq("entry_id", entryId)
          .then(({ data, error, status }) => {
            if (!isCurrent()) return;
            if (error) {
              console.error(error);
              onError(
                getRepositoryError(
                  error,
                  ErrorVerb.Read,
                  ErrorNoun.WorldMapPin,
                  true,
                  status,
                ),
              );
            } else {
              onPins(data, [], true);
            }
          });
      },
      (payload: RealtimePostgresChangesPayload<WorldMapPinDTO>) => {
        if (payload.eventType === "DELETE") {
          if (payload.old.pinned_entry_id)
            onPins([], [payload.old.pinned_entry_id], false);
        } else if (payload.new.entry_id === entryId) {
          onPins([payload.new], [], false);
        } else {
          // Moved to another map.
          onPins([], [payload.new.pinned_entry_id], false);
        }
      },
      { loadBeforeJoin: true },
    );
  }

  public static createWorldMap(map: WorldMapInsertDTO): Promise<WorldMapDTO> {
    return new Promise((resolve, reject) => {
      this.maps()
        .insert(map)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldMap,
                false,
                status,
              ),
            );
          } else {
            resolve(data);
          }
        });
    });
  }

  public static updateWorldMap(
    entryId: string,
    map: WorldMapUpdateDTO,
  ): Promise<WorldMapDTO> {
    return new Promise((resolve, reject) => {
      this.maps()
        .update(map)
        .eq("entry_id", entryId)
        .select()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldMap,
                false,
                status,
              ),
            );
          } else if (data.length === 0) {
            // RLS filters a refused update instead of raising.
            reject(
              createRepositoryError(
                ErrorReason.Forbidden,
                ErrorVerb.Update,
                ErrorNoun.WorldMap,
                false,
              ),
            );
          } else {
            resolve(data[0]);
          }
        });
    });
  }

  // Merges cells into their chunks; a null cell erases it.
  public static paintCells(
    entryId: string,
    cells: Record<string, Json>,
  ): Promise<WorldMapChunkDTO[]> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("paint_world_map_cells", { p_entry_id: entryId, p_cells: cells })
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldMap,
                false,
                status,
              ),
            );
          } else {
            resolve(data ?? []);
          }
        });
    });
  }

  // Clearing writes no cells into every chunk, keeping the rows so realtime
  // reports each one as an update.
  public static clearCells(entryId: string): Promise<WorldMapChunkDTO[]> {
    return new Promise((resolve, reject) => {
      this.chunks()
        .update({ cells: {} })
        .eq("entry_id", entryId)
        .select()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldMap,
                false,
                status,
              ),
            );
          } else {
            resolve(data);
          }
        });
    });
  }

  public static setPin(pin: TablesInsert<"world_map_pins">): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pins()
        .upsert(pin, { onConflict: "pinned_entry_id" })
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldMapPin,
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

  public static removePin(pinnedEntryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pins()
        .delete()
        .eq("pinned_entry_id", pinnedEntryId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldMapPin,
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
