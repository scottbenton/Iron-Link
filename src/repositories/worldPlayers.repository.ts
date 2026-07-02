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

export type WorldPlayerDTO = Tables<"world_players">;

export class WorldPlayersRepository {
  private static worldPlayers = () => supabase.from("world_players");

  public static listenToWorldPlayers(
    worldId: string,
    onWorldPlayerChanges: (
      changedWorldPlayers: Record<string, WorldPlayerDTO>,
      removedWorldPlayerIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      this.worldPlayers()
        .select("*")
        .eq("world_id", worldId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            onError(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.WorldPlayers,
                true,
                status,
              ),
            );
          } else {
            onWorldPlayerChanges(
              Object.fromEntries(
                data.map((player) => [player.user_id, player]),
              ),
              [],
              true,
            );
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldPlayerDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldPlayers,
            true,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onWorldPlayerChanges({ [payload.new.user_id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.user_id) {
        onWorldPlayerChanges({}, [payload.old.user_id], false);
      }
    };

    const unsubscribe = createSubscription(
      `world_players:world_id=eq.${worldId}`,
      "world_players",
      `world_id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static addWorldPlayer(
    worldId: string,
    userId: string,
    role: WorldPlayerDTO["role"],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldPlayers()
        .insert({ world_id: worldId, user_id: userId, role })
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldPlayers,
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

  public static updateWorldPlayerRole(
    worldId: string,
    userId: string,
    role: WorldPlayerDTO["role"],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldPlayers()
        .update({ role })
        .eq("world_id", worldId)
        .eq("user_id", userId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldPlayers,
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

  public static removeWorldPlayer(
    worldId: string,
    userId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worldPlayers()
        .delete()
        .eq("world_id", worldId)
        .eq("user_id", userId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldPlayers,
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
