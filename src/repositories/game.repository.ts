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
import { ColorScheme } from "./shared.types";
import { SpecialTrack } from "./shared.types";

export enum GameType {
  Solo = "solo",
  Coop = "co-op",
  Guided = "guided",
}

export type RulesetConfig = Record<string, boolean>;
export type ExpansionConfig = Record<string, Record<string, boolean>>;
export type PlaysetConfig = {
  disableAutomaticCursedDieRolls?: boolean;
  excludes?: {
    moves?: Record<string, boolean>;
    moveCategories?: Record<string, boolean>;
    assets?: Record<string, boolean>;
    assetCategories?: Record<string, boolean>;
    oracles?: Record<string, boolean>;
    oracleCategories?: Record<string, boolean>;
    truths?: Record<string, boolean>;
  };
};

export interface LegacyGameDTO {
  name: string;
  playerIds: string[];
  guideIds: string[];
  worldId: string | null;
  conditionMeters: Record<string, number>;
  specialTracks: Record<string, SpecialTrack>;
  gameType: GameType;
  colorScheme: ColorScheme | null;

  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
}

export type GameDTO = Tables<"games">;
export type GameDTOUpdate = Partial<Omit<GameDTO, "id" | "created_at">>;

export class GameRepository {
  public static games = () => supabase.from("games");

  public static collectionName = "games";

  public static async getGameInviteInfo(gameId: string): Promise<{
    name: string;
    game_type: GameDTO["game_type"];
  }> {
    return new Promise((resolve, reject) => {
      this.games()
        .select("name, game_type")
        .eq("id", gameId)
        .single()
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Read,
                ErrorNoun.Game,
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

  public static async getGame(gameId: string): Promise<GameDTO> {
    const { data, error, status } = await this.games()
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.Game,
        false,
        status,
      );
    }

    return data;
  }

  public static listenToGame(
    gameId: string,
    onGame: (game: GameDTO) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    // Fetch the initial state
    const getInitialState = () => {
      this.getGame(gameId).then(onGame).catch(onError);
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<GameDTO>,
    ) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.Game,
            false,
          ),
        );
      }
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        onGame(payload.new);
      } else {
        onError(
          getRepositoryError(
            "Unexpected event type",
            ErrorVerb.Read,
            ErrorNoun.Game,
            false,
          ),
        );
      }
    };

    const unsubscribe = createSubscription(
      `games:id=eq.${gameId}`,
      "games",
      `id=eq.${gameId}`,
      getInitialState,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static async getUsersGames(userId: string): Promise<GameDTO[]> {
    return new Promise((resolve, reject) => {
      this.games()
        .select("*, game_players!inner(*)")
        .eq("game_players.user_id", userId)
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.Game,
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

  public static async updateGame(
    gameId: string,
    game: GameDTOUpdate,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.games()
        .update(game)
        .eq("id", gameId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Update,
                ErrorNoun.Game,
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

  public static async deleteGame(gameId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.games()
        .delete()
        .eq("id", gameId)
        .then((response) => {
          if (response.error) {
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Delete,
                ErrorNoun.Game,
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

  public static async createGame(
    gameName: string,
    gameType: GameDTO["game_type"],
    rulesets: Record<string, boolean>,
    expansions: Record<string, Record<string, boolean>>,
    playset: PlaysetConfig,
  ): Promise<string> {
    return new Promise<string>((res, reject) => {
      this.games()
        .insert({
          name: gameName,
          game_type: gameType,
          rulesets,
          expansions,
          playset,
        })
        .select()
        .single()
        .then((response) => {
          if (response.error || !response.data) {
            console.error(response.error);
            reject(
              getRepositoryError(
                response.error,
                ErrorVerb.Create,
                ErrorNoun.Game,
                false,
                response.status,
              ),
            );
          } else {
            res(response.data.id);
          }
        });
    });
  }
}
