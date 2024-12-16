// Rolls, announcements, datasworn dialog, themes
import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { ColorScheme } from "repositories/shared.types";

import { IGameLog } from "services/gameLog.service";

export type VisibleRoll = { id?: string; roll: IGameLog };

interface AppStateState {
  announcement: string | null;
  dataswornDialogState: {
    isOpen: boolean;
    openId?: string;
    previousIds: string[];
  };

  visibleRolls: VisibleRoll[];

  colorScheme: ColorScheme;
}

interface AppStateActions {
  setAnnouncement: (announcement: string) => void;

  openDataswornDialog: (id: string) => void;
  closeDataswornDialog: () => void;
  prevDataswornDialog: () => void;

  setColorScheme: (colorScheme: ColorScheme) => void;

  addRoll: (rollId: string | undefined, roll: IGameLog) => void;
  updateRollIfPresent: (rollId: string, roll: IGameLog) => void;
  clearRoll: (index: number) => void;
  clearAllRolls: () => void;
}

export const useAppState = createWithEqualityFn<
  AppStateState & AppStateActions
>()(
  immer((set) => ({
    announcement: null,
    dataswornDialogState: {
      isOpen: false,
      previousIds: [],
    },
    visibleRolls: [],
    colorScheme: ColorScheme.Default,

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
