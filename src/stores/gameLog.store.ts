import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { messageReceivedSound } from "lib/audio.lib";

import { RollResult, RollType } from "repositories/shared.types";

import { GameLogService, IGameLog, LogType } from "services/gameLog.service";

import { useAppState } from "./appState.store";
import { useAuthStore } from "./auth.store";
import { GamePermission, useGameStore } from "./game.store";

const INITIAL_LOGS_TO_LOAD = 20;
const LOAD_MORE_AMOUNT = 20;

interface GameLogStoreState {
  logs: Record<string, IGameLog>;
  loading: boolean;
  error?: string;
  totalLogsToLoad: number;
  hasHitEndOfList: boolean;
  lastViewedLogsDate: Date | null;
  lastLoadedLogsDate: Date | null;
  playSoundOnLog: boolean;
}

interface GameLogStoreActions {
  getGameLog: (logId: string) => Promise<IGameLog>;
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
  setLastViewedLogsDate: (lastViewedLogsDate: Date) => void;
  updateLastSeenLogDate: (gameId: string, userId: string) => Promise<void>;
  setPlaySoundOnLog: (playSoundOnLog: boolean) => void;
  reset: () => void;
}

const localStoragePlaySoundOnLogKey = "shouldPlaySoundOnLog";
const localStorageLastLoadedLogsDateKey = "lastLoadedLogsDate";

function getLastLoadedLogsDate(gameId: string): Date | null {
  const dates = localStorage.getItem(localStorageLastLoadedLogsDateKey);
  return dates ? JSON.parse(dates)[gameId] || null : null;
}

function setLastLoadedLogsDate(gameId: string, date: Date): void {
  const dates = localStorage.getItem(localStorageLastLoadedLogsDateKey);
  const newDates = dates ? JSON.parse(dates) : {};
  newDates[gameId] = date;
  localStorage.setItem(
    localStorageLastLoadedLogsDateKey,
    JSON.stringify(newDates),
  );
}

const defaultGameLogStoreState: GameLogStoreState = {
  logs: {},
  playSoundOnLog:
    localStorage.getItem(localStoragePlaySoundOnLogKey) === "true",
  totalLogsToLoad: INITIAL_LOGS_TO_LOAD,
  loading: true,
  hasHitEndOfList: false,
  lastViewedLogsDate: null,
  lastLoadedLogsDate: null,
};

export const useGameLogStore = createWithEqualityFn<
  GameLogStoreState & GameLogStoreActions
>()(
  immer((set, getState) => ({
    ...defaultGameLogStoreState,

    getGameLog: (logId) => {
      return GameLogService.getGameLogFromID(logId);
    },

    listenToGameLogs: (gameId, isGuide, nLogs) => {
      set((store) => {
        store.lastLoadedLogsDate = getLastLoadedLogsDate(gameId);
      });
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
                if (log.logType === LogType.ROLL) {
                  useAppState.getState().updateRollIfPresent(id, log);
                }
              });

              state.hasHitEndOfList = Object.keys(addedLogs).length < nLogs;
            } else {
              Object.entries(addedLogs).forEach(([id, log]) => {
                state.logs[id] = log;
                state.totalLogsToLoad += 1;
                if (log.logType === LogType.ROLL) {
                  useAppState.getState().updateRollIfPresent(id, log);
                }
              });
              Object.entries(changedLogs).forEach(([id, log]) => {
                if (state.logs[id]) {
                  state.logs[id] = log;
                  if (log.logType === LogType.ROLL) {
                    useAppState.getState().updateRollIfPresent(id, log);
                  }
                }
                if (log.logType === LogType.ROLL) {
                  useAppState.getState().updateRollIfPresent(id, log);
                }
              });
              deletedLogIds.forEach((id) => {
                if (state.logs[id]) {
                  state.totalLogsToLoad -= 1;
                  delete state.logs[id];
                }
              });
            }

            if (Object.keys(addedLogs).length > 0) {
              parseNotificationsAndUpdateUnread(
                useAuthStore.getState().uid,
                Object.values(state.logs),
                state.lastViewedLogsDate,
                state.lastLoadedLogsDate,
                state.playSoundOnLog,
              );
            }
            const lastLoadedLogsDate = new Date();
            state.lastLoadedLogsDate = lastLoadedLogsDate;
            setLastLoadedLogsDate(gameId, lastLoadedLogsDate);
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
      if (
        existingLog &&
        existingLog.logType === LogType.ROLL &&
        existingLog.type === RollType.Stat
      ) {
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
    setLastViewedLogsDate: (date) => {
      set((state) => {
        state.lastViewedLogsDate = date;

        if (Object.keys(state.logs).length > 0) {
          parseNotificationsAndUpdateUnread(
            useAuthStore.getState().uid,
            Object.values(state.logs),
            state.lastViewedLogsDate,
            state.lastLoadedLogsDate,
            state.playSoundOnLog,
          );
        }
      });
    },
    updateLastSeenLogDate: (gameId, userId) => {
      return GameLogService.updateLastSeenLogDate(gameId, userId);
    },
    setPlaySoundOnLog: (playSoundOnLog) => {
      localStorage.setItem(
        localStoragePlaySoundOnLogKey,
        playSoundOnLog.toString(),
      );
      set((state) => ({ ...state, playSoundOnLog }));
    },
    reset: () => {
      set((state) => ({
        ...state,
        ...defaultGameLogStoreState,
        playSoundOnLog: state.playSoundOnLog,
      }));
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

function parseNotificationsAndUpdateUnread(
  uid: string | undefined,
  logs: IGameLog[],
  lastViewedLogsDate: Date | null,
  lastLoadedLogsDate: Date | null,
  isNotificationSoundEnabled: boolean,
) {
  let unreadCount = 0;
  let shouldPlayNotification = false;

  logs.forEach((log) => {
    if (
      uid &&
      uid !== log.uid &&
      (!lastViewedLogsDate || log.timestamp > lastViewedLogsDate)
    ) {
      unreadCount++;
      if (
        log.logType === LogType.MESSAGE &&
        (!lastLoadedLogsDate || log.timestamp > lastLoadedLogsDate)
      ) {
        shouldPlayNotification = true;
      }
    }
  });

  const appState = useAppState.getState();
  appState.setGameLogNotificationCount(unreadCount);

  if (shouldPlayNotification && isNotificationSoundEnabled) {
    messageReceivedSound.play().catch(() => {});
  }
}
