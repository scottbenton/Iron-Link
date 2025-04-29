// Rolls, announcements, datasworn dialog, themes
import { ColorScheme } from "@/repositories/shared.types";
import { IGameLog } from "@/services/gameLog.service";
import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

export type VisibleRoll = { id?: string; roll: IGameLog };

export enum Theme {
  Light = "light",
  Dark = "dark",
}

interface AppStateState {
  announcement: string | null;
  dataswornDialogState: {
    isOpen: boolean;
    openId?: string;
    previousIds: string[];
  };

  visibleRolls: VisibleRoll[];

  theme: Theme;
  colorScheme: ColorScheme;
}

interface AppStateActions {
  setAnnouncement: (announcement: string) => void;

  openDataswornDialog: (id: string) => void;
  closeDataswornDialog: () => void;
  prevDataswornDialog: () => void;

  setTheme: (theme: Theme) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
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

    theme: Theme.Light,
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
    setTheme: (theme) => {
      set((state) => {
        state.theme = theme;
      });
    },
    setColorScheme: (colorScheme) => {
      set((state) => {
        state.colorScheme = colorScheme;
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
