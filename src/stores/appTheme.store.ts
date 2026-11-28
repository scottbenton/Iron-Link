import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { ColorScheme } from "repositories/shared.types";

import { UserService } from "services/user.service";

import { getDefaultColorScheme, useAppState } from "./appState.store";
import { useUID } from "./auth.store";

export const appThemeLocalStorageKey = "iron-link-app-theme";

interface AppThemeState {
  /**
   * The person's Everywhere theme, used where neither the character nor the
   * game sets one. Null is Default (the seasonal theme). It is saved on
   * their account; this device keeps a copy so the first paint, and pages
   * seen signed out, wear it too.
   */
  appTheme: ColorScheme | null;
  /** Replaces the device copy with the account's theme. */
  loadAppTheme: (uid: string) => Promise<void>;
  /**
   * Shows the theme at once and saves it on the account when signed in.
   * A failed save puts the previous theme back and rejects.
   */
  setAppTheme: (
    uid: string | undefined,
    appTheme: ColorScheme | null,
  ) => Promise<void>;
}

// Counts changes the person makes, so a load that started before one never
// overwrites it when it lands.
let changeCount = 0;

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set, get) => ({
      appTheme: null,
      loadAppTheme: async (uid) => {
        const changesBefore = changeCount;
        const user = await UserService.getUser(uid);
        if (changeCount === changesBefore) {
          set({ appTheme: user.colorScheme });
        }
      },
      setAppTheme: async (uid, appTheme) => {
        const previous = get().appTheme;
        changeCount++;
        const change = changeCount;
        set({ appTheme });
        if (!uid) return;
        try {
          await UserService.setColorScheme(uid, appTheme);
        } catch (error) {
          if (changeCount === change) {
            set({ appTheme: previous });
          }
          throw error;
        }
      },
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

/** Loads the signed-in person's Everywhere theme from their account. */
export function useLoadAppTheme() {
  const uid = useUID();
  const loadAppTheme = useAppThemeStore((state) => state.loadAppTheme);

  useEffect(() => {
    if (uid) {
      // The device copy stays in place if the account can't be read.
      loadAppTheme(uid).catch(() => {});
    }
  }, [uid, loadAppTheme]);
}

/**
 * The colour scheme in effect: the page's (a character's or game's), else
 * the person's app theme, else Default.
 */
export function useEffectiveColorScheme(): ColorScheme {
  const pageScheme = useAppState((state) => state.colorScheme);
  const appTheme = useAppThemeStore((state) => state.appTheme);
  return pageScheme ?? appTheme ?? getDefaultColorScheme();
}
