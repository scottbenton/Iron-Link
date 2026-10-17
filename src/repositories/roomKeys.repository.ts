import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

// The live room a key unlocks: one note or entry, or the Guide-only rooms of a
// game or world.
export type RoomKeySource =
  | { noteId: string }
  | { worldEntryId: string }
  | { guideGameId: string }
  | { guideWorldId: string };

type RoomKeyDTO = Pick<Tables<"room_keys">, "key">;

function getTarget(source: RoomKeySource) {
  if ("noteId" in source) {
    return { table: "room_keys", column: "note_id", id: source.noteId };
  } else if ("worldEntryId" in source) {
    return {
      table: "room_keys",
      column: "world_entry_id",
      id: source.worldEntryId,
    };
  } else if ("guideGameId" in source) {
    return {
      table: "guide_room_keys",
      column: "game_id",
      id: source.guideGameId,
    };
  }
  return {
    table: "guide_room_keys",
    column: "world_id",
    id: source.guideWorldId,
  };
}

export class RoomKeysRepository {
  // Reports the key, then each rotation. A key the user cannot read reports
  // null, and someone who loses access is never sent the rotated key.
  public static listenToRoomKey(
    source: RoomKeySource,
    onKey: (key: string | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const { table, column, id } = getTarget(source);

    const startInitialLoad = (isCurrent: () => boolean) => {
      supabase
        .from(table as "room_keys")
        .select("key")
        .eq(column as "note_id", id)
        .maybeSingle()
        .then(({ data, error, status }) => {
          if (!isCurrent()) return;
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.RoomKey,
                false,
                status,
              ),
            );
          } else {
            onKey(data?.key ?? null);
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<RoomKeyDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.RoomKey,
            false,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onKey(payload.new.key);
      }
    };

    return createSubscription(
      `${table}:${column}=${id}`,
      table,
      `${column}=eq.${id}`,
      startInitialLoad,
      handlePayload,
      { loadBeforeJoin: true },
    );
  }
}
