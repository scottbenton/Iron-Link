import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { RollResult, RollType } from "repositories/shared.types";

import { GameLogService, IGameLog } from "services/gameLog.service";

import { useAppState } from "./appState.store";
import { GamePermission, useGameStore } from "./game.store";

const INITIAL_LOGS_TO_LOAD = 20;
const LOAD_MORE_AMOUNT = 20;

interface GameLogStoreState {
  logs: Record<string, IGameLog>;
  loading: boolean;
  error?: string;
  totalLogsToLoad: number;
  hasHitEndOfList: boolean;
}

interface GameLogStoreActions {
  listenToGameLogs: (
    gameId: string,
    isGuide: boolean,
    nLogs: number,
  ) => () => void;
  loadMoreLogsIfPresent: () => void;
  createLog: (logId: string, log: IGameLog) => Promise<string>;
  setGameLog: (logId: string, log: IGameLog) => Promise<string>;
  burnMomentumOnLog: (
    logId: string,
    momentum: number,
    newResult: RollResult,
  ) => Promise<string>;
  deleteLog: (logId: string) => Promise<void>;
  reset: () => void;
}

const defaultGameLogStoreState: GameLogStoreState = {
  logs: {},
  totalLogsToLoad: INITIAL_LOGS_TO_LOAD,
  loading: true,
  hasHitEndOfList: false,
};

export const useGameLogStore = createWithEqualityFn<
  GameLogStoreState & GameLogStoreActions
>()(
  immer((set, getState) => ({
    ...defaultGameLogStoreState,

    listenToGameLogs: (gameId, isGuide, nLogs) => {
      return GameLogService.listenToGameLogs(
        gameId,
        isGuide,
        nLogs,
        (addedLogs, changedLogs, deletedLogIds, replaceState) => {
          set((state) => {
            state.loading = false;
            state.error = undefined;

            if (replaceState) {
              state.logs = addedLogs;
              Object.entries(addedLogs).forEach(([id, log]) => {
                useAppState.getState().updateRollIfPresent(id, log);
              });

              state.hasHitEndOfList = Object.keys(addedLogs).length < nLogs;
            } else {
              Object.entries(addedLogs).forEach(([id, log]) => {
                state.logs[id] = log;
                state.totalLogsToLoad += 1;
                useAppState.getState().updateRollIfPresent(id, log);
              });
              Object.entries(changedLogs).forEach(([id, log]) => {
                if (state.logs[id]) {
                  state.logs[id] = log;
                  useAppState.getState().updateRollIfPresent(id, log);
                }
                useAppState.getState().updateRollIfPresent(id, log);
              });
              deletedLogIds.forEach((id) => {
                if (state.logs[id]) {
                  state.totalLogsToLoad -= 1;
                  delete state.logs[id];
                }
              });
            }
          });
        },
        (error) => {
          set((state) => {
            state.loading = false;
            state.error = error.message;
          });
        },
      );
    },

    loadMoreLogsIfPresent: () => {
      const state = getState();

      const areLogsLoading = state.loading;
      const hasHitEndOfList = state.hasHitEndOfList;

      if (!hasHitEndOfList && !areLogsLoading) {
        set((store) => {
          store.loading = true;
          store.totalLogsToLoad += LOAD_MORE_AMOUNT;
        });
      }
    },
    createLog: (logId, log) => {
      return GameLogService.setGameLog(logId, log);
    },
    setGameLog: (logId, log) => {
      return GameLogService.setGameLog(logId, log);
    },
    burnMomentumOnLog: (logId, momentum, newResult) => {
      const existingLog = getState().logs[logId];
      if (existingLog && existingLog.type === RollType.Stat) {
        return GameLogService.setGameLog(logId, {
          ...existingLog,
          momentumBurned: momentum,
          result: newResult,
        });
      }
      return Promise.reject("Log not found or not a stat roll");
    },
    deleteLog: (logId) => {
      return GameLogService.deleteGameLog(logId);
    },
    reset: () => {
      set((state) => ({ ...state, ...defaultGameLogStoreState }));
    },
  })),
  deepEqual,
);

export function useListenToGameLogs(gameId: string | undefined) {
  const listenToLogs = useGameLogStore((state) => state.listenToGameLogs);
  const reset = useGameLogStore((state) => state.reset);

  const isGameLoading = useGameStore((state) => state.loading);
  const isGuide = useGameStore(
    (state) => state.gamePermissions === GamePermission.Guide,
  );
  const totalLogsToLoad = useGameLogStore((state) => state.totalLogsToLoad);

  useEffect(() => {
    if (gameId && !isGameLoading) {
      return listenToLogs(gameId, isGuide, totalLogsToLoad);
    }
  }, [listenToLogs, isGameLoading, isGuide, gameId, totalLogsToLoad]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [gameId, reset]);
}
