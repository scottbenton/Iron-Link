import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

interface MenuStateState {
  isCharacterDetailsDialogOpen: boolean;
  isCharacterStatsDialogOpen: boolean;
  isColorSchemeDialogOpen: boolean;
  isCharacterEditAccessDialogOpen: boolean;

  isGameNameDialogOpen: boolean;
  isRulesetDialogOpen: boolean;
  isGameThemeDialogOpen: boolean;
  isSecondScreenDialogOpen: boolean;
}

interface MenuStateActions {
  setIsCharacterDetailsDialogOpen: (open: boolean) => void;
  setIsCharacterStatsDialogOpen: (open: boolean) => void;
  setIsColorSchemeDialogOpen: (open: boolean) => void;
  setIsCharacterEditAccessDialogOpen: (open: boolean) => void;

  setIsGameNameDialogOpen: (open: boolean) => void;
  setIsRulesetDialogOpen: (open: boolean) => void;
  setIsGameThemeDialogOpen: (open: boolean) => void;
  setIsSecondScreenDialogOpen: (open: boolean) => void;
}

export const useMenuState = createWithEqualityFn<
  MenuStateState & MenuStateActions
>()(
  immer((set) => ({
    isCharacterDetailsDialogOpen: false,
    isCharacterStatsDialogOpen: false,
    isColorSchemeDialogOpen: false,
    isCharacterEditAccessDialogOpen: false,

    setIsCharacterDetailsDialogOpen: (open) => {
      set((state) => {
        state.isCharacterDetailsDialogOpen = open;
      });
    },
    setIsCharacterStatsDialogOpen: (open) => {
      set((state) => {
        state.isCharacterStatsDialogOpen = open;
      });
    },
    setIsColorSchemeDialogOpen: (open) => {
      set((state) => {
        state.isColorSchemeDialogOpen = open;
      });
    },
    setIsCharacterEditAccessDialogOpen: (open) => {
      set((state) => {
        state.isCharacterEditAccessDialogOpen = open;
      });
    },

    isGameNameDialogOpen: false,
    isRulesetDialogOpen: false,
    isGameThemeDialogOpen: false,
    isSecondScreenDialogOpen: false,

    setIsGameNameDialogOpen: (open) => {
      set((state) => {
        state.isGameNameDialogOpen = open;
      });
    },
    setIsRulesetDialogOpen: (open) => {
      set((state) => {
        state.isRulesetDialogOpen = open;
      });
    },
    setIsGameThemeDialogOpen: (open) => {
      set((state) => {
        state.isGameThemeDialogOpen = open;
      });
    },
    setIsSecondScreenDialogOpen: (open) => {
      set((state) => {
        state.isSecondScreenDialogOpen = open;
      });
    },
  })),
  deepEqual,
);
