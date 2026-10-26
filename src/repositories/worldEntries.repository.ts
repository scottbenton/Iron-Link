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
  ErrorReason,
  ErrorVerb,
  RepositoryError,
  createRepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import { WorldPermission, isGuideEquivalent } from "./shared.types";

export type WorldEntryDTO = Tables<"world_entries">;
export type WorldEntryInsertDTO = TablesInsert<"world_entries">;
export type WorldEntryUpdateDTO = TablesUpdate<"world_entries">;

// Everything except notes_content, which is a large Yjs byte column fetched
// on demand (mirrors how notes exclude note_content_bytes from list queries).
const ENTRY_LIST_COLUMNS = `
  id,
  world_id,
  category_id,
  parent_entry_id,
  name,
  icon,
  image_filename,
  map,
  map_background_filename,
  map_settings,
  read_permissions,
  edit_permissions,
  author_id,
  created_at,
  updated_at
`;

// Mirrors the world_entries select policy so realtime payloads are filtered
// the same way RLS filters the initial load.
function canReadEntry(
  entry: Pick<WorldEntryDTO, "read_permissions" | "author_id">,
  uid: string | undefined,
  permission: WorldPermission,
): boolean {
  switch (entry.read_permissions) {
    case "public":
      return true;
    case "all_players":
      return permission !== WorldPermission.None;
    case "guides_and_author":
      return entry.author_id === uid || isGuideEquivalent(permission);
    case "only_guides":
      return isGuideEquivalent(permission);
    case "only_author":
      return entry.author_id === uid;
    default:
      return false;
  }
}

export class WorldEntriesRepository {
  private static worldEntries = () => supabase.from("world_entries");

  public static listenToWorldEntries(
    uid: string | undefined,
    worldId: string,
    permission: WorldPermission,
    onWorldEntryChanges: (
      changedEntries: Record<string, WorldEntryDTO>,
      removedEntryIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = (isCurrent: () => boolean) => {
      const query = this.worldEntries()
        .select(ENTRY_LIST_COLUMNS)
        .eq("world_id", worldId);

      if (permission === WorldPermission.None) {
        query.eq("read_permissions", "public");
      } else if (!isGuideEquivalent(permission)) {
        query.or(
          `read_permissions.eq."public",read_permissions.eq."all_players",and(read_permissions.eq."only_author",author_id.eq."${uid}"),and(read_permissions.eq."guides_and_author",author_id.eq."${uid}")`,
        );
      } else {
        query.or(
          `read_permissions.eq."public",read_permissions.eq."all_players",read_permissions.eq."only_guides",read_permissions.eq."guides_and_author",and(read_permissions.eq."only_author",author_id.eq."${uid}")`,
        );
      }

      query.then(({ data, error, status }) => {
        if (!isCurrent()) return;
        if (error) {
          console.error(error);
          onError(
            getRepositoryError(
              error,
              ErrorVerb.Read,
              ErrorNoun.WorldEntry,
              true,
              status,
            ),
          );
        } else {
          onWorldEntryChanges(
            Object.fromEntries(
              data.map((entry) => [
                entry.id,
                entry as unknown as WorldEntryDTO,
              ]),
            ),
            [],
            true,
          );
        }
      });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldEntryDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldEntry,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        if (canReadEntry(payload.new, uid, permission)) {
          onWorldEntryChanges({ [payload.new.id]: payload.new }, [], false);
        } else {
          // A permission change can revoke access to an entry we already hold
          onWorldEntryChanges({}, [payload.new.id], false);
        }
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        onWorldEntryChanges({}, [payload.old.id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_entries:world_id=eq.${worldId}`,
      "world_entries",
      `world_id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
      { loadBeforeJoin: true },
    );

    return () => {
      unsubscribe();
    };
  }

  public static addWorldEntry(entry: WorldEntryInsertDTO): Promise<string> {
    return new Promise((resolve, reject) => {
      this.worldEntries()
        .insert(entry)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldEntry,
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

  public static updateWorldEntry(
    entryId: string,
    entry: WorldEntryUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldEntries()
        .update(entry)
        .eq("id", entryId)
        .select("id")
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldEntry,
                false,
                status,
              ),
            );
          } else if (data.length === 0) {
            // RLS filters refused updates instead of raising, so an update
            // the edit permissions reject, or of a deleted entry, changes
            // nothing and returns no rows.
            reject(
              createRepositoryError(
                ErrorReason.Forbidden,
                ErrorVerb.Update,
                ErrorNoun.WorldEntry,
                false,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  // Moves are validated by the database; a refused parent rejects with
  // ErrorReason.InvalidParent.
  public static setWorldEntryParent(
    entryId: string,
    parentEntryId: string | null,
  ): Promise<void> {
    return this.updateWorldEntry(entryId, { parent_entry_id: parentEntryId });
  }

  public static getWorldEntryNotesContent(
    entryId: string,
  ): Promise<WorldEntryDTO> {
    return new Promise((resolve, reject) => {
      this.worldEntries()
        .select("notes_content")
        .eq("id", entryId)
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldEntry,
                false,
                status,
              ),
            );
          } else {
            resolve(data as WorldEntryDTO);
          }
        });
    });
  }

  public static deleteWorldEntry(entryId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldEntries()
        .delete()
        .eq("id", entryId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldEntry,
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
