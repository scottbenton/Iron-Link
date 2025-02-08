import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import { GameType } from "./game.repository";

export class GameInviteKeyRepository {
  public static async getGameInviteKey(gameId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase.functions
        .invoke("get-game-invite-key", { body: { gameId } })
        .then(({ data, error }) => {
          if (error || !data.invite_key) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.GameInviteKey,
                false,
              ),
            );
          } else {
            resolve(data.invite_key);
          }
        });
    });
  }

  public static async recreateGameInviteKey(gameId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      supabase.functions
        .invoke("recreate-game-invite-key", { body: { gameId } })
        .then(({ error }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.GameInviteKey,
                false,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static async getGameInfoFromInviteKey(
    inviteKey: string,
  ): Promise<{ gameName: string; gameType: GameType } | { gameId: string }> {
    return new Promise((resolve, reject) => {
      supabase.functions
        .invoke("get-game-info-from-invite-key", {
          body: { gameInviteKey: inviteKey },
        })
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.GameInviteKey,
                false,
              ),
            );
          } else {
            resolve(data);
          }
        });
    });
  }

  public static async addPlayerToGameFromInviteKey(
    inviteKey: string,
    userId: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase.functions
        .invoke("add-player-to-game-invite", {
          body: { gameInviteKey: inviteKey, userId },
        })
        .then(({ error, data }) => {
          if (error || !data.gameId) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.GameInviteKey,
                false,
              ),
            );
          } else {
            resolve(data.gameId);
          }
        });
    });
  }
}
