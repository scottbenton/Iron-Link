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

export type WorldPlayersDTO = Tables<"world_players">;
export type InsertWorldPlayersDTO = TablesInsert<"world_players">;
export type UpdateWorldPlayersDTO = TablesUpdate<"world_players">;

export class WorldPlayersRepository {
  private static worldPlayers = () => supabase.from("world_players");

  public static addWorldPlayer = (
    worldPlayer: InsertWorldPlayersDTO,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      this.worldPlayers()
        .insert(worldPlayer)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Create,
                ErrorNoun.World,
                false,
                result.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  };

  public static listenToWorldPlayerRole = (
    worldId: string,
    gameId: string,
    userId: string,
    onWorldPlayer: (worldPlayer: WorldPlayersDTO | null) => void,
    onError: (error: RepositoryError) => void,
  ): (() => void) => {
    const startInitialLoad = () => {
      this.worldPlayers()
        .select("*")
        .eq("game_id", gameId)
        .eq("world_id", worldId)
        .eq("user_id", userId)
        .single()
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            onError(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.WorldPlayer,
                false,
                result.status,
              ),
            );
          } else {
            onWorldPlayer(result.data);
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldPlayersDTO>,
    ) => {
      if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
        onWorldPlayer(payload.new);
      } else if (payload.eventType === "DELETE") {
        onWorldPlayer(null);
      }
    };

    return createSubscription(
      `world_players_game_${gameId}_user_${userId}_world_${worldId}`,
      "world_players",
      `world_id=eq.${worldId}&game_id=${gameId}&user_id=eq.${userId}`,
      startInitialLoad,
      handlePayload,
    );
  };
}
