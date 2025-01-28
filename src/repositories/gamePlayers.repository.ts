import { Tables } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type GamePlayerDTO = Tables<"game_players">;

export class GamePlayersRepository {
  public static gamePlayers = () => supabase.from("game_players");

  public static listenToGamePlayers(
    gameId: string,
    onGamePlayers: (
      changedPlayers: Record<string, GamePlayerDTO>,
      removedGamePlayerIds: string[],
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    this.gamePlayers()
      .select()
      .eq("game_id", gameId)
      .then((response) => {
        if (response.error) {
          console.error(response.error);
          onError(
            getRepositoryError(
              response.error,
              ErrorVerb.Read,
              ErrorNoun.GamePlayers,
              true,
              response.status,
            ),
          );
        } else {
          onGamePlayers(
            Object.fromEntries(
              response.data.map((player) => [player.user_id, player]),
            ),
            [],
          );
        }
      });

    const subscription = supabase
      .channel(`game_players:game_id=eq.${gameId}`)
      .on<GamePlayerDTO>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.errors) {
            console.error(payload.errors);
            onError(
              getRepositoryError(
                payload.errors,
                ErrorVerb.Read,
                ErrorNoun.GamePlayers,
                true,
              ),
            );
          }
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            onGamePlayers({ [payload.new.user_id]: payload.new }, []);
          } else if (payload.eventType === "DELETE" && payload.old.user_id) {
            onGamePlayers({}, [payload.old.user_id]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  public static getGamePlayerEntryIfExists(
    gameId: string,
    playerId: string,
  ): Promise<GamePlayerDTO | null> {
    return new Promise((resolve, reject) => {
      this.gamePlayers()
        .select()
        .eq("game_id", gameId)
        .eq("user_id", playerId)
        .maybeSingle()
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Read,
                ErrorNoun.GamePlayers,
                false,
                response.status,
              ),
            );
          } else {
            resolve(response.data);
          }
        });
    });
  }

  public static addPlayerToGame(
    gameId: string,
    playerId: string,
    role: GamePlayerDTO["role"],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gamePlayers()
        .insert({
          game_id: gameId,
          user_id: playerId,
          role,
        })
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Create,
                ErrorNoun.GamePlayers,
                false,
                response.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static updateGamePlayerRole(
    gameId: string,
    playerId: string,
    role: GamePlayerDTO["role"],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gamePlayers()
        .update({ role })
        .eq("game_id", gameId)
        .eq("user_id", playerId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Update,
                ErrorNoun.GamePlayers,
                false,
                response.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static updateAllGamePlayerRoles(
    gameId: string,
    role: GamePlayerDTO["role"],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gamePlayers()
        .update({ role })
        .eq("game_id", gameId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Update,
                ErrorNoun.GamePlayers,
                true,
                response.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static removePlayerFromGame(
    gameId: string,
    playerId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gamePlayers()
        .delete()
        .eq("game_id", gameId)
        .eq("user_id", playerId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Delete,
                ErrorNoun.GamePlayers,
                false,
                response.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }
}
