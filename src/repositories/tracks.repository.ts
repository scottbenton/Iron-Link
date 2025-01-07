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

export type TrackDTO = Tables<"game_tracks">;
type InsertTrackDTO = TablesInsert<"game_tracks">;
type UpdateTrackDTO = TablesUpdate<"game_tracks">;

export class TracksRepository {
  private static tracks = () => supabase.from("game_tracks");

  public static listenToGameTracks(
    gameId: string,
    onTrackChanges: (
      changedTracks: Record<string, TrackDTO>,
      deletedTrackIds: string[],
    ) => void,
    onError: (error: StorageError) => void,
  ): () => void {
    this.tracks()
      .select()
      .eq("game_id", gameId)
      .then((result) => {
        if (result.error) {
          console.error(result.error);
          onError(
            convertUnknownErrorToStorageError(
              result.error,
              "Failed to get initial tracks",
            ),
          );
        } else {
          const tracks: Record<string, TrackDTO> = {};
          result.data?.forEach((track) => {
            tracks[track.id] = track;
          });
          onTrackChanges(tracks, []);
        }
      });

    const subscription = supabase
      .channel(`game_tracks:game_id=eq.${gameId}`)
      .on<TrackDTO>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_tracks",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.errors) {
            console.error(payload.errors);
            onError(new UnknownError("Failed to get track changes"));
          }
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            onTrackChanges({ [payload.new.id]: payload.new }, []);
          } else if (payload.eventType === "DELETE" && payload.old.id) {
            onTrackChanges({}, [payload.old.id]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  public static async createTrack(track: InsertTrackDTO): Promise<string> {
    return new Promise((resolve, reject) => {
      this.tracks()
        .insert(track)
        .select()
        .single()
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              convertUnknownErrorToStorageError(
                result.error,
                "Failed to get initial tracks",
              ),
            );
          } else {
            resolve(result.data.id);
          }
        });
    });
  }

  public static async updateTrack(
    trackId: string,
    track: UpdateTrackDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tracks()
        .update(track)
        .eq("id", trackId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              convertUnknownErrorToStorageError(
                result.error,
                "Failed to update track",
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static async deleteTrack(trackId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tracks()
        .delete()
        .eq("id", trackId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              convertUnknownErrorToStorageError(
                result.error,
                "Failed to delete track",
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }
}

export enum TrackTypes {
  Vow = "vow",
  Journey = "journey",
  Fray = "fray",
  BondProgress = "bondProgress",
  Clock = "clock",
  SceneChallenge = "sceneChallenge",
}

export type ProgressTracks =
  | TrackTypes.BondProgress
  | TrackTypes.Fray
  | TrackTypes.Journey
  | TrackTypes.Vow;
export type TrackSectionProgressTracks =
  | TrackTypes.Fray
  | TrackTypes.Journey
  | TrackTypes.Vow;
export type TrackSectionTracks =
  | TrackSectionProgressTracks
  | TrackTypes.Clock
  | TrackTypes.SceneChallenge;

export enum TrackStatus {
  Active = "active",
  Completed = "completed",
}

export enum Difficulty {
  Troublesome = "troublesome",
  Dangerous = "dangerous",
  Formidable = "formidable",
  Extreme = "extreme",
  Epic = "epic",
}

export enum AskTheOracle {
  AlmostCertain = "almost_certain",
  Likely = "likely",
  FiftyFifty = "fifty_fifty",
  Unlikely = "unlikely",
  SmallChance = "small_chance",
}
