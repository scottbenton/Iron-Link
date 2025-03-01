import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import {
  AskTheOracle,
  Difficulty,
  TrackSectionProgressTracks,
  TrackStatus,
} from "@/repositories/tracks.repository";
import { ITrack, TracksService } from "@/services/tracks.service";

interface TracksStoreState {
  tracks: Record<string, ITrack>;
  loading: boolean;
  error?: string;
  showCompletedTracks: boolean;
}

interface TracksStoreActions {
  listenToTracks: (gameId: string) => () => void;
  setShowCompletedTracks: (showCompletedTracks: boolean) => void;

  addProgressTrack: (
    gameId: string,
    trackType: TrackSectionProgressTracks,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
  ) => Promise<string>;
  updateProgressTrack: (
    trackId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
    resetProgress: boolean,
  ) => Promise<void>;

  addClock: (
    gameId: string,
    label: string,
    description: string | undefined,
    segments: number,
  ) => Promise<string>;
  updateClock: (
    clockId: string,
    label: string,
    description: string | undefined,
    segments: number,
  ) => Promise<void>;

  addSceneChallenge: (
    gameId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
  ) => Promise<string>;
  updateSceneChallenge: (
    trackId: string,
    label: string,
    description: string | undefined,
    difficulty: Difficulty,
    resetProgress: boolean,
  ) => Promise<void>;

  updateTrackStatus: (trackId: string, status: TrackStatus) => Promise<void>;
  updateTrackValue: (trackId: string, value: number) => Promise<void>;
  updateClockFilledSegments: (
    trackId: string,
    filledSegments: number,
  ) => Promise<void>;
  updateClockSelectedOracle: (
    trackId: string,
    oracleKey: AskTheOracle,
  ) => Promise<void>;

  deleteTrack: (trackId: string) => Promise<void>;

  resetStore: () => void;
}

const defaultTracksStoreState: TracksStoreState = {
  tracks: {},
  loading: true,
  showCompletedTracks: false,
};

export const useTracksStore = createWithEqualityFn<
  TracksStoreState & TracksStoreActions
>()(
  immer((set) => ({
    ...defaultTracksStoreState,
    listenToTracks: (gameId: string) => {
      return TracksService.listenToGameTracks(
        gameId,
        (changedTracks, deletedTrackIds, replaceState) => {
          set((state) => {
            state.loading = false;
            state.error = undefined;

            if (replaceState) {
              state.tracks = changedTracks;
            } else {
              state.tracks = {
                ...state.tracks,
                ...changedTracks,
              };

              deletedTrackIds.forEach((trackId) => {
                delete state.tracks[trackId];
              });
            }
          });
        },
        (error) => {
          set((state) => {
            state.error = error.message;
          });
        },
      );
    },
    setShowCompletedTracks: (showCompletedTracks) => {
      set((state) => {
        state.showCompletedTracks = showCompletedTracks;
      });
    },

    addProgressTrack: (gameId, trackType, label, description, difficulty) => {
      return TracksService.createProgressTrack(
        gameId,
        trackType,
        label,
        description,
        difficulty,
      );
    },
    updateProgressTrack: (
      trackId,
      label,
      description,
      difficulty,
      resetProgress,
    ) => {
      return TracksService.updateProgressTrack(
        trackId,
        label,
        description,
        difficulty,
        resetProgress,
      );
    },

    addClock: (gameId, label, description, segments) => {
      return TracksService.createClock(gameId, label, description, segments);
    },
    updateClock: (clockId, label, description, segments) => {
      return TracksService.updateClock(clockId, label, description, segments);
    },

    addSceneChallenge: (gameId, label, description, difficulty) => {
      return TracksService.createSceneChallenge(
        gameId,
        label,
        description,
        difficulty,
      );
    },
    updateSceneChallenge: (
      trackId,
      label,
      description,
      difficulty,
      resetProgress,
    ) => {
      return TracksService.updateSceneChallenge(
        trackId,
        label,
        description,
        difficulty,
        resetProgress,
      );
    },

    updateTrackStatus: (trackId, status) => {
      return TracksService.setTrackStatus(trackId, status);
    },
    updateTrackValue: (trackId, value) => {
      return TracksService.updateTrackValue(trackId, value);
    },
    updateClockFilledSegments: (trackId, filledSegments) => {
      return TracksService.updateClockFilledSegments(trackId, filledSegments);
    },
    updateClockSelectedOracle: (trackId, oracleKey) => {
      return TracksService.updateClockSelectedOracle(trackId, oracleKey);
    },

    deleteTrack: (trackId) => {
      return TracksService.deleteTrack(trackId);
    },

    resetStore: () => {
      set((store) => ({
        ...store,
        ...defaultTracksStoreState,
      }));
    },
  })),
  deepEqual,
);

export function useListenToTracks(gameId: string | undefined) {
  const listenToTracks = useTracksStore((store) => store.listenToTracks);
  const resetStore = useTracksStore((store) => store.resetStore);
  useEffect(() => {
    if (gameId) {
      const unsubscribe = listenToTracks(gameId);
      return () => {
        resetStore();
        unsubscribe();
      };
    }
  }, [listenToTracks, gameId, resetStore]);
}
