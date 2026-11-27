import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const gamePageLayoutLocalStorageKey = "iron-link-game-page-layout";

export type CharacterSheetSection = "overview" | "assets" | "tracks";
export type GameOverviewSection = "characters" | "assets" | "tracks";

export const DEFAULT_GAME_SIDEBAR_WIDTH = 350;

interface GamePageLayoutState {
  /** The sheet (or game overview) column's width, per device. */
  sheetWidth: number;
  /** The reference column's width, per device. */
  referenceWidth: number;
  sheetCollapsed: boolean;
  referenceCollapsed: boolean;
  /**
   * The tab the character sheet and the game overview show. Kept here,
   * rather than in their columns, so a collapsed column's rail can open
   * one of them. Not remembered between visits.
   */
  characterSection: CharacterSheetSection;
  overviewSection: GameOverviewSection;
  setSheetWidth: (width: number) => void;
  setReferenceWidth: (width: number) => void;
  setSheetCollapsed: (collapsed: boolean) => void;
  setReferenceCollapsed: (collapsed: boolean) => void;
  setCharacterSection: (section: CharacterSheetSection) => void;
  setOverviewSection: (section: GameOverviewSection) => void;
}

// How this device lays out the game page's columns.
export const useGamePageLayoutStore = create<GamePageLayoutState>()(
  persist(
    (set) => ({
      sheetWidth: DEFAULT_GAME_SIDEBAR_WIDTH,
      referenceWidth: DEFAULT_GAME_SIDEBAR_WIDTH,
      sheetCollapsed: false,
      referenceCollapsed: false,
      characterSection: "overview",
      overviewSection: "characters",
      setSheetWidth: (sheetWidth) => set({ sheetWidth }),
      setReferenceWidth: (referenceWidth) => set({ referenceWidth }),
      setSheetCollapsed: (sheetCollapsed) => set({ sheetCollapsed }),
      setReferenceCollapsed: (referenceCollapsed) =>
        set({ referenceCollapsed }),
      setCharacterSection: (characterSection) => set({ characterSection }),
      setOverviewSection: (overviewSection) => set({ overviewSection }),
    }),
    {
      name: gamePageLayoutLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sheetWidth: state.sheetWidth,
        referenceWidth: state.referenceWidth,
        sheetCollapsed: state.sheetCollapsed,
        referenceCollapsed: state.referenceCollapsed,
      }),
    },
  ),
);
