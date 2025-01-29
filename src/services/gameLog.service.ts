import { RepositoryError } from "repositories/errors/RepositoryErrors";
import { GameLogDTO, GameLogRepository } from "repositories/gameLog.repository";
import { RollResult, RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

export interface IBaseRoll {
  id: string;
  type: RollType;
  rollLabel: string;
  timestamp: Date;
  gameId: string;
  characterId: string | null;
  uid: string | null;
  guidesOnly: boolean;
}

export interface IStatRoll extends IBaseRoll {
  type: RollType.Stat;
  moveId?: string;
  action: number;
  actionTotal: number;
  challenge1: number;
  challenge2: number;
  modifier: number;
  matchedNegativeMomentum: boolean;
  adds: number;
  result: RollResult;
  momentumBurned: number | null;
  statKey: string;
}

export interface IOracleTableRoll extends IBaseRoll {
  type: RollType.OracleTable;
  roll: number | number[];
  result: string;
  oracleCategoryName?: string;
  oracleId: string;
  match: boolean;
}

export interface ITrackProgressRoll extends IBaseRoll {
  type: RollType.TrackProgress;
  challenge1: number;
  challenge2: number;
  trackProgress: number;
  result: RollResult;
  trackType: TrackTypes;
  moveId: string;
}

export interface ISpecialTrackProgressRoll extends IBaseRoll {
  type: RollType.SpecialTrackProgress;
  challenge1: number;
  challenge2: number;
  trackProgress: number;
  result: RollResult;
  specialTrackKey: string;
  moveId: string;
}

export interface IClockProgressionRoll extends IBaseRoll {
  type: RollType.ClockProgression;
  roll: number;
  oracleTitle: string;
  result: string;
  oracleId: string;
  match: boolean;
}

export type IGameLog =
  | IStatRoll
  | IOracleTableRoll
  | ITrackProgressRoll
  | ISpecialTrackProgressRoll
  | IClockProgressionRoll;

export class GameLogService {
  public static async getNGameLogs(
    gameId: string,
    isGuide: boolean,
    n: number,
    beforeTime?: Date,
  ): Promise<IGameLog[]> {
    const logs = await GameLogRepository.getLastNLogsInGame(
      gameId,
      isGuide,
      n,
      beforeTime,
    );
    return logs.map((log) => this.convertGameLogDTOToGameLog(log));
  }

  public static listenToGameLogs(
    gameId: string,
    isGuide: boolean,
    onLogs: (
      newLogs: Record<string, IGameLog>,
      changedLogs: Record<string, IGameLog>,
      deletedLogIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return GameLogRepository.listenToGameLogs(
      gameId,
      isGuide,
      (newLogs, changedLogs, deletedLogIds, replaceState) => {
        onLogs(
          this.convertGameLogDTOMapToGameLogMap(newLogs),
          this.convertGameLogDTOMapToGameLogMap(changedLogs),
          deletedLogIds,
          replaceState,
        );
      },
      onError,
    );
  }

  public static async setGameLog(
    logId: string,
    log: IGameLog,
  ): Promise<string> {
    return GameLogRepository.insertGameLog(
      logId,
      this.convertGameLogToGameLogDTO(log),
    );
  }

  public static async deleteGameLog(logId: string): Promise<void> {
    return GameLogRepository.deleteGameLog(logId);
  }

  private static convertGameLogDTOMapToGameLogMap(
    dtoMap: Record<string, GameLogDTO>,
  ): Record<string, IGameLog> {
    return Object.fromEntries(
      Object.entries(dtoMap).map(([id, dto]) => [
        id,
        this.convertGameLogDTOToGameLog(dto),
      ]),
    );
  }

  private static convertGameLogDTOToGameLog(dto: GameLogDTO): IGameLog {
    switch (dto.type) {
      case "stat_roll":
        return {
          type: RollType.Stat,
          id: dto.id,
          gameId: dto.game_id,
          moveId: dto.log_data.move_id ?? undefined,
          action: dto.log_data.action,
          actionTotal: dto.log_data.action_total,
          challenge1: dto.log_data.challenge_1,
          challenge2: dto.log_data.challenge_2,
          modifier: dto.log_data.modifier,
          matchedNegativeMomentum: dto.log_data.matched_negative_momentum,
          adds: dto.log_data.adds,
          result: dto.log_data.result,
          momentumBurned: dto.log_data.momentum_burned,
          rollLabel: dto.log_data.label,
          timestamp: new Date(dto.created_at),
          characterId: dto.character_id,
          uid: dto.user_id,
          guidesOnly: dto.guides_only ?? false,
          statKey: dto.log_data.stat_key,
        } satisfies IStatRoll;
      case "oracle_table_roll":
        return {
          type: RollType.OracleTable,
          id: dto.id,
          gameId: dto.game_id,
          roll: dto.log_data.roll,
          result: dto.log_data.result,
          oracleCategoryName: dto.log_data.oracle_category_name ?? undefined,
          oracleId: dto.log_data.oracle_id,
          match: dto.log_data.match,
          rollLabel: "Oracle Roll",
          timestamp: new Date(dto.created_at),
          characterId: dto.character_id,
          uid: dto.user_id,
          guidesOnly: dto.guides_only ?? false,
        } satisfies IOracleTableRoll;
      case "track_progress_roll":
        return {
          type: RollType.TrackProgress,
          id: dto.id,
          gameId: dto.game_id,
          challenge1: dto.log_data.challenge_1,
          challenge2: dto.log_data.challenge_2,
          trackProgress: dto.log_data.track_progress,
          result: dto.log_data.result,
          trackType: dto.log_data.track_type,
          moveId: dto.log_data.move_id,
          rollLabel: "Track Progress Roll",
          timestamp: new Date(dto.created_at),
          characterId: dto.character_id,
          uid: dto.user_id,
          guidesOnly: dto.guides_only ?? false,
        } satisfies ITrackProgressRoll;
      case "special_track_progress_roll":
        return {
          type: RollType.SpecialTrackProgress,
          id: dto.id,
          gameId: dto.game_id,
          challenge1: dto.log_data.challenge_1,
          challenge2: dto.log_data.challenge_2,
          trackProgress: dto.log_data.track_progress,
          result: dto.log_data.result,
          specialTrackKey: dto.log_data.special_track_key,
          moveId: dto.log_data.move_id,
          rollLabel: "Special Track Roll",
          timestamp: new Date(dto.created_at),
          characterId: dto.character_id,
          uid: dto.user_id,
          guidesOnly: dto.guides_only ?? false,
        } satisfies ISpecialTrackProgressRoll;
      case "clock_progression_roll":
        return {
          type: RollType.ClockProgression,
          id: dto.id,
          gameId: dto.game_id,
          roll: dto.log_data.roll,
          oracleTitle: dto.log_data.oracle_title,
          result: dto.log_data.result,
          oracleId: dto.log_data.oracle_id,
          match: dto.log_data.match,
          rollLabel: "Clock Progression Roll",
          timestamp: new Date(dto.created_at),
          characterId: dto.character_id,
          uid: dto.user_id,
          guidesOnly: dto.guides_only ?? false,
        } satisfies IClockProgressionRoll;
    }
  }

  private static convertGameLogToGameLogDTO(log: IGameLog): GameLogDTO {
    switch (log.type) {
      case RollType.Stat:
        return {
          id: log.id,
          game_id: log.gameId,
          type: "stat_roll",
          log_data: {
            move_id: log.moveId ?? null,
            action: log.action,
            action_total: log.actionTotal,
            challenge_1: log.challenge1,
            challenge_2: log.challenge2,
            modifier: log.modifier,
            matched_negative_momentum: log.matchedNegativeMomentum,
            adds: log.adds,
            result: log.result,
            momentum_burned: log.momentumBurned,
            label: log.rollLabel,
            stat_key: log.statKey,
          },
          created_at: log.timestamp.toISOString(),
          character_id: log.characterId,
          user_id: log.uid,
          guides_only: log.guidesOnly,
        };
      case RollType.OracleTable:
        return {
          id: log.id,
          game_id: log.gameId,
          type: "oracle_table_roll",
          log_data: {
            roll: log.roll,
            result: log.result,
            oracle_category_name: log.oracleCategoryName ?? null,
            oracle_id: log.oracleId,
            match: log.match,
          },
          created_at: log.timestamp.toISOString(),
          character_id: log.characterId,
          user_id: log.uid,
          guides_only: log.guidesOnly,
        };
      case RollType.TrackProgress:
        return {
          id: log.id,
          game_id: log.gameId,
          type: "track_progress_roll",
          log_data: {
            challenge_1: log.challenge1,
            challenge_2: log.challenge2,
            track_progress: log.trackProgress,
            result: log.result,
            track_type: log.trackType,
            move_id: log.moveId,
          },
          created_at: log.timestamp.toISOString(),
          character_id: log.characterId,
          user_id: log.uid,
          guides_only: log.guidesOnly,
        };
      case RollType.SpecialTrackProgress:
        return {
          id: log.id,
          game_id: log.gameId,
          type: "special_track_progress_roll",
          log_data: {
            challenge_1: log.challenge1,
            challenge_2: log.challenge2,
            track_progress: log.trackProgress,
            result: log.result,
            special_track_key: log.specialTrackKey,
            move_id: log.moveId,
          },
          created_at: log.timestamp.toISOString(),
          character_id: log.characterId,
          user_id: log.uid,
          guides_only: log.guidesOnly,
        };
      case RollType.ClockProgression:
        return {
          id: log.id,
          game_id: log.gameId,
          type: "clock_progression_roll",
          log_data: {
            roll: log.roll,
            oracle_title: log.oracleTitle,
            result: log.result,
            oracle_id: log.oracleId,
            match: log.match,
          },
          created_at: log.timestamp.toISOString(),
          character_id: log.characterId,
          user_id: log.uid,
          guides_only: log.guidesOnly,
        };
    }
  }
}
