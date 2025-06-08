import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
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
}
