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
  loadLogsBefore: Date | null;
  hasHitEndOfList: boolean;
}

interface GameLogStoreActions {
  listenToGameLogs: (gameId: string, isGuide: boolean) => () => void;
  loadMoreLogsIfPresent: (gameId: string, isGuide: boolean) => void;

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
  loading: true,
  loadLogsBefore: null,
  hasHitEndOfList: false,
};

export const useGameLogStore = createWithEqualityFn<
  GameLogStoreState & GameLogStoreActions
>()(
  immer((set, getState) => ({
    ...defaultGameLogStoreState,

    listenToGameLogs: (gameId, isGuide) => {
      GameLogService.getNGameLogs(gameId, isGuide, INITIAL_LOGS_TO_LOAD)
        .then((logs) => {
          set((state) => {
            state.loading = false;
            state.error = undefined;
            state.logs = logs.reduce(
              (acc, log) => {
                acc[log.id] = log;
                return acc;
              },
              {} as Record<string, IGameLog>,
            );
            state.loadLogsBefore = logs[logs.length - 1]?.timestamp || null;
          });
        })
        .catch(() => {
          set((state) => {
            state.loading = false;
            state.error = "Failed to load logs";
          });
        });

      return GameLogService.listenToGameLogs(
        gameId,
        isGuide,
        (addedLogs, changedLogs, deletedLogIds, replaceState) => {
          set((state) => {
            state.loading = false;
            state.error = undefined;

            if (replaceState) {
              state.logs = addedLogs;
              Object.entries(addedLogs).forEach(([id, log]) => {
                useAppState.getState().updateRollIfPresent(id, log);
              });
            } else {
              Object.entries(addedLogs).forEach(([id, log]) => {
                state.logs[id] = log;
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
                delete state.logs[id];
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

    loadMoreLogsIfPresent: (gameId, isGuide) => {
      const state = getState();

      const areLogsLoading = state.loading;
      const hasHitEndOfList = state.hasHitEndOfList;
      const loadLogsBefore = state.loadLogsBefore;

      if (!hasHitEndOfList && !areLogsLoading && loadLogsBefore) {
        set((store) => {
          store.loading = true;
        });

        GameLogService.getNGameLogs(
          gameId,
          isGuide,
          LOAD_MORE_AMOUNT,
          loadLogsBefore,
        )
          .then((logs) => {
            set((store) => {
              store.loading = false;
              store.error = undefined;
              store.logs = {
                ...store.logs,
                ...logs.reduce(
                  (acc, log) => {
                    acc[log.id] = log;
                    return acc;
                  },
                  {} as Record<string, IGameLog>,
                ),
              };
              store.loadLogsBefore = logs[logs.length - 1]?.timestamp || null;
              store.hasHitEndOfList = logs.length < LOAD_MORE_AMOUNT;
            });
          })
          .catch(() => {
            set((store) => {
              store.loading = false;
              store.error = "Failed to load more logs";
            });
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

  useEffect(() => {
    if (gameId && !isGameLoading) {
      return listenToLogs(gameId, isGuide);
    }
  }, [listenToLogs, isGameLoading, isGuide, gameId]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [gameId, reset]);
}
