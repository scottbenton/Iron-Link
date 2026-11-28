import { create } from "zustand";

import {
  SettingsMenuAction,
  SettingsMenuCharacter,
  SettingsMenuGame,
} from "ui/layout";

/** The items a page handles itself; the app's own stay with the menu. */
export type ContributedSettingsAction = Exclude<
  SettingsMenuAction,
  "accessibility" | "advancedFeatures" | "admin" | "signOut"
>;

/**
 * What a page adds to the one settings menu: the game page's game and
 * character sections and the log sound. With a contribution, Change Theme
 * goes to its `onSelect`, which opens the page's own Theme dialog.
 */
export interface AppSettingsContribution {
  game?: SettingsMenuGame;
  /** The open character, when the person can edit it. */
  character?: SettingsMenuCharacter;
  logSound?: boolean;
  onLogSoundChange?: (on: boolean) => void;
  onSelect: (action: ContributedSettingsAction) => void;
  onDeleteCharacter?: () => void;
  onDeleteGame?: () => void;
}

interface AppSettingsMenuState {
  contribution: AppSettingsContribution | null;
  setContribution: (contribution: AppSettingsContribution) => void;
  /** Clears the contribution only if it is still this one. */
  clearContribution: (contribution: AppSettingsContribution) => void;
}

export const useAppSettingsMenuStore = create<AppSettingsMenuState>()(
  (set) => ({
    contribution: null,
    setContribution: (contribution) => set({ contribution }),
    clearContribution: (contribution) =>
      set((state) =>
        state.contribution === contribution ? { contribution: null } : state,
      ),
  }),
);
