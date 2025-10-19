// Rolls, announcements, datasworn dialog, themes
import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { ColorScheme } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

export type VisibleRoll = { id?: string; roll: IGameLogRoll };

export enum ReferenceTabs {
  Moves = "moves",
  Oracles = "oracles",
  GameLog = "game-log",
}

interface AppStateState {
  announcement: string | null;
  dataswornDialogState: {
    isOpen: boolean;
    openId?: string;
    previousIds: string[];
  };

  visibleRolls: VisibleRoll[];

  colorScheme: ColorScheme;

  currentReferenceTab: ReferenceTabs;
  gameLogNotificationCount: number;
}

interface AppStateActions {
  setAnnouncement: (announcement: string) => void;

  openDataswornDialog: (id: string) => void;
  closeDataswornDialog: () => void;
  prevDataswornDialog: () => void;

  setColorScheme: (colorScheme: ColorScheme) => void;

  addRoll: (rollId: string | undefined, roll: IGameLogRoll) => void;
  updateRollIfPresent: (rollId: string, roll: IGameLogRoll) => void;
  clearRoll: (index: number) => void;
  clearAllRolls: () => void;
  setCurrentReferenceTab: (tab: ReferenceTabs) => void;
  setGameLogNotificationCount: (count: number) => void;
  resetReference: () => void;
}

const defaultAppState: AppStateState = {
  announcement: null,
  dataswornDialogState: {
    isOpen: false,
    previousIds: [],
  },
  visibleRolls: [],
  colorScheme: getDefaultColorScheme(),
  currentReferenceTab: ReferenceTabs.Moves,
  gameLogNotificationCount: 0,
};

export const useAppState = createWithEqualityFn<
  AppStateState & AppStateActions
>()(
  immer((set) => ({
    ...defaultAppState,

    setAnnouncement: (announcement) => set({ announcement }),

    openDataswornDialog: (id) => {
      set((state) => {
        if (state.dataswornDialogState.isOpen) {
          state.dataswornDialogState.previousIds.push(
            state.dataswornDialogState.openId!,
          );
        } else {
          state.dataswornDialogState.previousIds = [];
        }
        state.dataswornDialogState.isOpen = true;
        state.dataswornDialogState.openId = id;
      });
    },
    closeDataswornDialog: () => {
      set((state) => {
        state.dataswornDialogState.isOpen = false;
      });
    },
    prevDataswornDialog: () => {
      set((state) => {
        if (state.dataswornDialogState.previousIds.length > 0) {
          const newOpenId = state.dataswornDialogState.previousIds.pop();
          state.dataswornDialogState.openId = newOpenId;
        }
      });
    },
    setColorScheme: (colorScheme) => {
      set((state) => {
        state.colorScheme = colorScheme;
      });
    },
    addRoll: (rollId, roll) => {
      set((state) => {
        state.visibleRolls.push({ id: rollId, roll });
        if (state.visibleRolls.length > 3) {
          state.visibleRolls.splice(0, 1);
        }
      });
    },
    clearRoll: (index) => {
      set((state) => {
        state.visibleRolls.splice(index, 1);
      });
    },
    clearAllRolls: () => {
      set((state) => {
        state.visibleRolls = [];
      });
    },
    updateRollIfPresent: (rollId, roll) => {
      set((state) => {
        const rollIndex = state.visibleRolls.findIndex(
          ({ id }) => id === rollId,
        );
        if (rollIndex >= 0) {
          state.visibleRolls[rollIndex].roll = roll;
        }
      });
    },
    setCurrentReferenceTab: (tab) => {
      set((state) => {
        state.currentReferenceTab = tab;
      });
    },
    setGameLogNotificationCount: (count) => {
      set((state) => {
        state.gameLogNotificationCount =
          state.currentReferenceTab === ReferenceTabs.GameLog ? 0 : count;
      });
    },
    resetReference: () => {
      set((state) => {
        state.currentReferenceTab = defaultAppState.currentReferenceTab;
        state.gameLogNotificationCount =
          defaultAppState.gameLogNotificationCount;
      });
    },
  })),
  deepEqual,
);

export function useAnnouncement() {
  return useAppState((state) => state.announcement);
}

export function useSetAnnouncement() {
  return useAppState((state) => state.setAnnouncement);
}

export function useOpenDataswornDialog() {
  return useAppState((state) => state.openDataswornDialog);
}

export function useSetColorScheme() {
  return useAppState((state) => state.setColorScheme);
}

export function useAddRollSnackbar() {
  return useAppState((state) => state.addRoll);
}

export function getDefaultColorScheme() {
  const isJune = new Date().getMonth() === 5;
  return isJune ? ColorScheme.PrideTraditional : ColorScheme.Default;
}
