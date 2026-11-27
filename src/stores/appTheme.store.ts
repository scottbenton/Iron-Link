import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ColorScheme } from "repositories/shared.types";

import { getDefaultColorScheme, useAppState } from "./appState.store";

export const appThemeLocalStorageKey = "iron-link-app-theme";

interface AppThemeState {
  /**
   * The person's Everywhere theme, used where neither the character nor the
   * game sets one. Null is Default (the seasonal theme). Kept on this device
   * for now.
   */
  appTheme: ColorScheme | null;
  setAppTheme: (appTheme: ColorScheme | null) => void;
}

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      appTheme: null,
      setAppTheme: (appTheme) => set({ appTheme }),
    }),
    {
      name: appThemeLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ appTheme: state.appTheme }),
      // A scheme a later build removed reads as Default.
      merge: (persisted, current) => {
        const appTheme = (persisted as Partial<AppThemeState> | undefined)
          ?.appTheme;
        return {
          ...current,
          appTheme: Object.values(ColorScheme).includes(appTheme as ColorScheme)
            ? (appTheme as ColorScheme)
            : null,
        };
      },
    },
  ),
);

/**
 * The colour scheme in effect: the page's (a character's or game's), else
 * the person's app theme, else Default.
 */
export function useEffectiveColorScheme(): ColorScheme {
  const pageScheme = useAppState((state) => state.colorScheme);
  const appTheme = useAppThemeStore((state) => state.appTheme);
  return pageScheme ?? appTheme ?? getDefaultColorScheme();
}
