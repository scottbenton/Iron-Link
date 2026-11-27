import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

interface MenuStateState {
  isCharacterDetailsDialogOpen: boolean;
  isCharacterStatsDialogOpen: boolean;
  isCharacterEditAccessDialogOpen: boolean;
  /** The one Theme dialog: this character, this game and Everywhere. */
  isThemeDialogOpen: boolean;

  isGameNameDialogOpen: boolean;
  isRulesetDialogOpen: boolean;
}

interface MenuStateActions {
  setIsCharacterDetailsDialogOpen: (open: boolean) => void;
  setIsCharacterStatsDialogOpen: (open: boolean) => void;
  setIsCharacterEditAccessDialogOpen: (open: boolean) => void;
  setIsThemeDialogOpen: (open: boolean) => void;

  setIsGameNameDialogOpen: (open: boolean) => void;
  setIsRulesetDialogOpen: (open: boolean) => void;
}

export const useMenuState = createWithEqualityFn<
  MenuStateState & MenuStateActions
>()(
  immer((set) => ({
    isCharacterDetailsDialogOpen: false,
    isCharacterStatsDialogOpen: false,
    isCharacterEditAccessDialogOpen: false,
    isThemeDialogOpen: false,

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
    setIsThemeDialogOpen: (open) => {
      set((state) => {
        state.isThemeDialogOpen = open;
      });
    },
    setIsCharacterEditAccessDialogOpen: (open) => {
      set((state) => {
        state.isCharacterEditAccessDialogOpen = open;
      });
    },

    isGameNameDialogOpen: false,
    isRulesetDialogOpen: false,

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
  })),
  deepEqual,
);
