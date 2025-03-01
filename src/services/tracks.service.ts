import { RepositoryError } from "@/repositories/errors/RepositoryErrors";
import {
  AskTheOracle,
  Difficulty,
  TrackDTO,
  TrackSectionProgressTracks,
  TrackSectionTracks,
  TracksRepository,
  TrackStatus,
  TrackTypes,
} from "@/repositories/tracks.repository";

import { Enums } from "@/types/supabase-generated.type";

export interface IBaseTrack {
  id: string;
  label: string;
  type: TrackSectionTracks;
  description?: string;
  value: number;
  status: TrackStatus;
  createdDate: Date;
}

export interface IProgressTrack extends IBaseTrack {
  type: TrackSectionProgressTracks;
  difficulty: Difficulty;
}

export interface ISceneChallenge extends IBaseTrack {
  type: TrackTypes.SceneChallenge;
  segmentsFilled: number;
  difficulty: Difficulty;
}

export interface IClock extends IBaseTrack {
  type: TrackTypes.Clock;
  segments: number;
  oracleKey?: AskTheOracle;
}

export type ITrack = IProgressTrack | IClock | ISceneChallenge;

export class TracksService {
  public static listenToGameTracks(
    gameId: string,
    onTrackChanges: (
      changedTracks: Record<string, ITrack>,
      deletedTrackIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return TracksRepository.listenToGameTracks(
      gameId,
      (changedTracks, deletedTrackIds, replaceState) => {
        const convertedChangedTracks = Object.fromEntries(
          Object.entries(changedTracks).map(([trackId, trackDTO]) => [
            trackId,
            this.convertTrackDTOToTrack(trackDTO),
          ]),
        );

        onTrackChanges(convertedChangedTracks, deletedTrackIds, replaceState);
      },
      onError,
    );
  }

  public static async createProgressTrack(
    gameId: string,
    trackType: TrackSectionProgressTracks,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
  ): Promise<string> {
    let progressTrackType: Enums<"progress_track_type">;
    switch (trackType) {
      case TrackTypes.Fray:
        progressTrackType = "combat";
        break;
      case TrackTypes.Journey:
        progressTrackType = "journey";
        break;
      default:
        progressTrackType = "vow";
    }
    return TracksRepository.createTrack({
      game_id: gameId,
      type: "progress_track",
      progress_track_type: progressTrackType,
      label,
      description,
      track_difficulty: difficulty,
    });
  }
  public static async createClock(
    gameId: string,
    label: string,
    description: string | undefined,
    segments: number,
  ) {
    return TracksRepository.createTrack({
      game_id: gameId,
      type: "clock",
      label,
      description,
      total_clock_segments: segments,
      track_difficulty: "troublesome",
    });
  }
  public static async createSceneChallenge(
    gameId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
  ) {
    return TracksRepository.createTrack({
      game_id: gameId,
      type: "scene_challenge",
      label,
      description,
      track_difficulty: difficulty,
      total_clock_segments: 4,
    });
  }

  public static async updateProgressTrack(
    trackId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
    resetProgress: boolean,
  ): Promise<void> {
    return TracksRepository.updateTrack(trackId, {
      label,
      description,
      track_difficulty: difficulty,
      completed_ticks: resetProgress ? 0 : undefined,
    });
  }
  public static async updateClock(
    clockId: string,
    label: string,
    description: string | undefined,
    segments: number,
  ) {
    return TracksRepository.updateTrack(clockId, {
      label,
      description,
      total_clock_segments: segments,
    });
  }
  public static async updateSceneChallenge(
    trackId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
    resetProgress: boolean,
  ) {
    return TracksRepository.updateTrack(trackId, {
      label,
      description,
      track_difficulty: difficulty,
      completed_ticks: resetProgress ? 0 : undefined,
    });
  }

  public static async setTrackStatus(
    trackId: string,
    status: TrackStatus,
  ): Promise<void> {
    return TracksRepository.updateTrack(trackId, {
      is_completed: status === TrackStatus.Completed,
    });
  }

  public static async updateTrackValue(
    trackId: string,
    value: number,
  ): Promise<void> {
    return TracksRepository.updateTrack(trackId, { completed_ticks: value });
  }

  public static async updateClockFilledSegments(
    trackId: string,
    filledSegments: number,
  ): Promise<void> {
    return TracksRepository.updateTrack(trackId, {
      completed_clock_segments: filledSegments,
    });
  }

  public static async updateClockSelectedOracle(
    trackId: string,
    oracleKey: AskTheOracle,
  ): Promise<void> {
    return TracksRepository.updateTrack(trackId, {
      clock_oracle_key: oracleKey,
    });
  }

  public static async deleteTrack(trackId: string): Promise<void> {
    return TracksRepository.deleteTrack(trackId);
  }

  private static convertTrackDTOToTrack(trackDTO: TrackDTO): ITrack {
    if (trackDTO.type === "clock") {
      let oracleKey: AskTheOracle | undefined;
      switch (trackDTO.clock_oracle_key) {
        case "almost_certain":
          oracleKey = AskTheOracle.AlmostCertain;
          break;
        case "likely":
          oracleKey = AskTheOracle.Likely;
          break;
        case "fifty_fifty":
          oracleKey = AskTheOracle.FiftyFifty;
          break;
        case "unlikely":
          oracleKey = AskTheOracle.SmallChance;
          break;
        default:
          oracleKey = AskTheOracle.Unlikely;
      }
      return {
        id: trackDTO.id,
        label: trackDTO.label,
        type: TrackTypes.Clock,
        description: trackDTO.description ?? undefined,
        segments: trackDTO.total_clock_segments,
        value: trackDTO.completed_clock_segments,
        status: trackDTO.is_completed
          ? TrackStatus.Completed
          : TrackStatus.Active,
        createdDate: new Date(trackDTO.created_at),
        oracleKey: oracleKey,
      } satisfies IClock;
    } else if (trackDTO.type === "scene_challenge") {
      let difficulty: Difficulty;
      switch (trackDTO.track_difficulty) {
        case "dangerous":
          difficulty = Difficulty.Dangerous;
          break;
        case "formidable":
          difficulty = Difficulty.Formidable;
          break;
        case "extreme":
          difficulty = Difficulty.Extreme;
          break;
        case "epic":
          difficulty = Difficulty.Epic;
          break;
        default:
          difficulty = Difficulty.Troublesome;
      }
      return {
        id: trackDTO.id,
        label: trackDTO.label,
        type: TrackTypes.SceneChallenge,
        description: trackDTO.description ?? undefined,
        segmentsFilled: trackDTO.completed_clock_segments,
        value: trackDTO.completed_ticks,
        status: trackDTO.is_completed
          ? TrackStatus.Completed
          : TrackStatus.Active,
        createdDate: new Date(trackDTO.created_at),
        difficulty,
      } satisfies ISceneChallenge;
    } else {
      let difficulty: Difficulty;
      switch (trackDTO.track_difficulty) {
        case "dangerous":
          difficulty = Difficulty.Dangerous;
          break;
        case "formidable":
          difficulty = Difficulty.Formidable;
          break;
        case "extreme":
          difficulty = Difficulty.Extreme;
          break;
        case "epic":
          difficulty = Difficulty.Epic;
          break;
        default:
          difficulty = Difficulty.Troublesome;
      }
      let progressTrackType: TrackSectionProgressTracks;
      switch (trackDTO.progress_track_type) {
        case "journey":
          progressTrackType = TrackTypes.Journey;
          break;
        case "combat":
          progressTrackType = TrackTypes.Fray;
          break;
        default:
          progressTrackType = TrackTypes.Vow;
      }
      return {
        id: trackDTO.id,
        label: trackDTO.label,
        type: progressTrackType,
        description: trackDTO.description ?? undefined,
        value: trackDTO.completed_ticks,
        status: trackDTO.is_completed
          ? TrackStatus.Completed
          : TrackStatus.Active,
        createdDate: new Date(trackDTO.created_at),
        difficulty,
      } satisfies IProgressTrack;
    }
  }
}
