import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  StorageError,
  UnknownError,
  convertUnknownErrorToStorageError,
} from "./errors/storageErrors";
import { RollResult } from "./shared.types";
import { TrackTypes } from "./tracks.repository";

type BaseGameLogDTO = Tables<"game_logs">;
type StatRollGameLogDTO = Omit<BaseGameLogDTO, "log_data"> & {
  type: "stat_roll";
  log_data: StatRollJSONData;
};
type OracleRollGameLogDTO = Omit<BaseGameLogDTO, "log_data"> & {
  type: "oracle_table_roll";
  log_data: OracleRollJSONData;
};
type TrackProgressRollGameLogDTO = Omit<BaseGameLogDTO, "log_data"> & {
  type: "track_progress_roll";
  log_data: TrackProgressRollJSONData;
};
type SpecialTrackRollGameLogDTO = Omit<BaseGameLogDTO, "log_data"> & {
  type: "special_track_progress_roll";
  log_data: SpecialTrackRollJSONData;
};
type ClockProgressionRollGameLogDTO = Omit<BaseGameLogDTO, "log_data"> & {
  type: "clock_progression_roll";
  log_data: ClockProgressionRollJSONData;
};
export type GameLogDTO =
  | StatRollGameLogDTO
  | OracleRollGameLogDTO
  | TrackProgressRollGameLogDTO
  | SpecialTrackRollGameLogDTO
  | ClockProgressionRollGameLogDTO;

type BaseInsertGameLogDTO = TablesInsert<"game_logs">;
type InsertStateGameLogDTO = Omit<BaseInsertGameLogDTO, "log_data"> & {
  type: "stat_roll";
  log_data: StatRollJSONData;
};
type InsertOracleGameLogDTO = Omit<BaseInsertGameLogDTO, "log_data"> & {
  type: "oracle_table_roll";
  log_data: OracleRollJSONData;
};
type InsertTrackProgressGameLogDTO = Omit<BaseInsertGameLogDTO, "log_data"> & {
  type: "track_progress_roll";
  log_data: TrackProgressRollJSONData;
};
type InsertSpecialTrackGameLogDTO = Omit<BaseInsertGameLogDTO, "log_data"> & {
  type: "special_track_progress_roll";
  log_data: SpecialTrackRollJSONData;
};
type InsertClockProgressionGameLogDTO = Omit<
  BaseInsertGameLogDTO,
  "log_data"
> & {
  type: "clock_progression_roll";
  log_data: ClockProgressionRollJSONData;
};
type InsertGameLogDTO =
  | InsertStateGameLogDTO
  | InsertOracleGameLogDTO
  | InsertTrackProgressGameLogDTO
  | InsertSpecialTrackGameLogDTO
  | InsertClockProgressionGameLogDTO;

type BaseUpdateGameLogDTO = TablesUpdate<"game_logs">;
type UpdateStatGameLogDTO = Omit<BaseUpdateGameLogDTO, "log_data"> & {
  log_data?: StatRollJSONData;
};
type UpdateOracleGameLogDTO = Omit<BaseUpdateGameLogDTO, "log_data"> & {
  log_data?: OracleRollJSONData;
};
type UpdateTrackProgressGameLogDTO = Omit<BaseUpdateGameLogDTO, "log_data"> & {
  log_data?: TrackProgressRollJSONData;
};
type UpdateSpecialTrackGameLogDTO = Omit<BaseUpdateGameLogDTO, "log_data"> & {
  log_data?: SpecialTrackRollJSONData;
};
type UpdateClockProgressionGameLogDTO = Omit<
  BaseUpdateGameLogDTO,
  "log_data"
> & {
  log_data?: ClockProgressionRollJSONData;
};
type UpdateGameLogDTO = UpdateStatGameLogDTO &
  UpdateOracleGameLogDTO &
  UpdateTrackProgressGameLogDTO &
  UpdateSpecialTrackGameLogDTO &
  UpdateClockProgressionGameLogDTO;

export interface StatRollJSONData {
  label: string;
  move_id: string | null;
  stat_key: string;
  action: number;
  action_total: number;
  challenge_1: number;
  challenge_2: number;
  modifier: number;
  matched_negative_momentum: boolean;
  adds: number;
  result: RollResult;
  momentum_burned: number | null;
}
export interface OracleRollJSONData {
  roll: number | number[];
  result: string;
  oracle_category_name: string | null;
  oracle_id: string;
  match: boolean;
}

export interface TrackProgressRollJSONData {
  challenge_1: number;
  challenge_2: number;
  track_progress: number;
  result: RollResult;
  track_type: TrackTypes;
  move_id: string;
}

export interface SpecialTrackRollJSONData {
  challenge_1: number;
  challenge_2: number;
  track_progress: number;
  result: RollResult;
  special_track_key: string;
  move_id: string;
}

export interface ClockProgressionRollJSONData {
  roll: number;
  oracle_title: string;
  result: string;
  oracle_id: string;
  match: boolean;
}

export class GameLogRepository {
  private static gameLogs = () => supabase.from("game_logs");

  public static getLastNLogsInGame(
    gameId: string,
    isGuide: boolean,
    n: number,
    beforeTime?: Date,
  ): Promise<GameLogDTO[]> {
    return new Promise((resolve, reject) => {
      let query = this.gameLogs()
        .select()
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(n);

      if (!isGuide) {
        query = query.eq("guides_only", false);
      }

      if (beforeTime) {
        query = query.lt("created_at", beforeTime);
      }

      query.then((result) => {
        if (result.error) {
          console.error(result.error);
          reject(
            convertUnknownErrorToStorageError(
              result.error,
              "Failed to get game logs",
            ),
          );
        } else {
          resolve(result.data as unknown as GameLogDTO[]);
        }
      });
    });
  }

  public static listenToGameLogs(
    gameId: string,
    isGuide: boolean,
    onLogChange: (newLog: GameLogDTO, added: boolean) => void,
    onLogDelete: (logId: string) => void,
    onError: (error: StorageError) => void,
  ): () => void {
    const subscription = supabase
      .channel(`game_logs:game_id=eq.${gameId}`)
      .on<GameLogDTO>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_logs",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            if (payload.new.guides_only && !isGuide) {
              return;
            }
            onLogChange(payload.new, payload.eventType === "INSERT");
          } else if (payload.eventType === "DELETE" && payload.old.id) {
            onLogDelete(payload.old.id);
          } else {
            console.error("Unknown event type", payload.eventType);
            onError(new UnknownError("Failed to get game log changes"));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  public static async insertGameLog(
    logId: string,
    log: InsertGameLogDTO,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.gameLogs()
        .upsert(log as unknown as BaseGameLogDTO)
        .eq("id", logId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              convertUnknownErrorToStorageError(
                response.error,
                "Failed to create game log",
              ),
            );
          } else {
            resolve(logId);
          }
        });
    });
  }

  public static async updateGameLog(
    logId: string,
    log: UpdateGameLogDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gameLogs()
        .update(log as unknown as BaseGameLogDTO)
        .eq("id", logId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              convertUnknownErrorToStorageError(
                response.error,
                "Failed to update game log",
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static async deleteGameLog(logId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gameLogs()
        .delete()
        .eq("id", logId)
        .then((response) => {
          if (response.error) {
            console.error(response.error);
            reject(
              convertUnknownErrorToStorageError(
                response.error,
                "Failed to delete game log",
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }
}
