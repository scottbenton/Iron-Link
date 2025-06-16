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

export type WorldDTO = Tables<"worlds">;
export type InsertWorldDTO = TablesInsert<"worlds">;
export type UpdateWorldDTO = TablesUpdate<"worlds">;

export class WorldsRepository {
  private static worlds = () => supabase.from("worlds");

  public static createWorld = (world: InsertWorldDTO): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.worlds()
        .insert(world)
        .select("id")
        .single()
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
            resolve(result.data.id);
          }
        });
    });
  };

  public static listenToWorld = (
    worldId: string,
    onWorld: (world: WorldDTO | null) => void,
    onError: (error: RepositoryError) => void,
  ): (() => void) => {
    const startInitialLoad = () => {
      this.worlds()
        .select("*")
        .eq("id", worldId)
        .single()
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            onError(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.World,
                false,
                result.status,
              ),
            );
          } else {
            onWorld(result.data);
          }
        });
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldDTO>,
    ) => {
      if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
        onWorld(payload.new);
      } else if (payload.eventType === "DELETE") {
        onWorld(null);
      }
    };

    return createSubscription(
      `worlds:${worldId}`,
      "worlds",
      `id=eq.${worldId}`,
      startInitialLoad,
      handlePayload,
    );
  };

  public static getUsersWorlds = (
    uid: string,
    role?: "guide" | "player" | "owner",
  ): Promise<WorldDTO[]> => {
    return new Promise((resolve, reject) => {
      const query = this.worlds()
        .select("*, world_players(user_id)")
        .eq("world_players.user_id", uid);

      if (role) {
        query.eq("world_players.role", role);
      }

      query.then(({ data, error, status }) => {
        if (error) {
          console.error(error);
          reject(
            getRepositoryError(
              error,
              ErrorVerb.Read,
              ErrorNoun.World,
              true,
              status,
            ),
          );
        } else {
          resolve(data || []);
        }
      });
    });
  };
}
