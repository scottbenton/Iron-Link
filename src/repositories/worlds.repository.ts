import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables, TablesUpdate } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import { WorldPermission } from "./shared.types";

export type WorldDTO = Tables<"worlds">;
export type WorldUpdateDTO = TablesUpdate<"worlds">;

export class WorldsRepository {
  private static worlds = () => supabase.from("worlds");

  public static async getWorld(worldId: string): Promise<WorldDTO> {
    const { data, error, status } = await this.worlds()
      .select("*")
      .eq("id", worldId)
      .single();

    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.World,
        false,
        status,
      );
    }

    return data;
  }

  public static listenToWorld(
    worldId: string,
    onWorld: (world: WorldDTO) => void,
    onWorldDeleted: () => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const getInitialState = () => {
      this.getWorld(worldId).then(onWorld).catch(onError);
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldDTO>,
    ) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.World,
            false,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onWorld(payload.new);
      } else if (payload.eventType === "DELETE") {
        onWorldDeleted();
      }
    };

    const unsubscribe = createSubscription(
      `worlds:id=eq.${worldId}`,
      "worlds",
      `id=eq.${worldId}`,
      getInitialState,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  // RLS already limits the result to worlds the user can read
  // (explicit membership or membership in a linked game).
  public static async getUsersWorlds(): Promise<WorldDTO[]> {
    return new Promise((resolve, reject) => {
      this.worlds()
        .select("*")
        .then(({ data, error, status }) => {
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
            resolve(data);
          }
        });
    });
  }

  // Inserts the world and the creator's owner membership row atomically;
  // the world_players insert policy is owner-only, so the initial owner row
  // can only be created through this security-definer function.
  public static async createWorld(
    name: string,
    description: string | null,
    settingKey: string | null,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("create_world", {
          p_name: name,
          p_description: description ?? undefined,
          p_setting_key: settingKey ?? undefined,
        })
        .then(({ data, error, status }) => {
          if (error || !data) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.World,
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

  public static async updateWorld(
    worldId: string,
    world: WorldUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worlds()
        .update(world)
        .eq("id", worldId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.World,
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

  public static async deleteWorld(worldId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worlds()
        .delete()
        .eq("id", worldId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.World,
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

  public static async getWorldPermission(
    worldId: string,
    userId: string,
  ): Promise<WorldPermission> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("world_role", { p_world_id: worldId, p_uid: userId })
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.World,
                false,
                status,
              ),
            );
          } else {
            const permissions = Object.values(WorldPermission) as string[];
            resolve(
              data && permissions.includes(data)
                ? (data as WorldPermission)
                : WorldPermission.None,
            );
          }
        });
    });
  }
}
