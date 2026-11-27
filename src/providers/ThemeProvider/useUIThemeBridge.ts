import { useTheme } from "@mui/material";
import { useLayoutEffect } from "react";

import { applyUITheme } from "ui/theme";

import { useEffectiveColorScheme } from "stores/appTheme.store";

import { uiSchemeNames } from "./uiSchemeNames";

/**
 * Keeps the UI library on the app's theme: MUI's resolved light or dark mode
 * and the chosen colour scheme become `data-theme`, `data-panda-theme` and
 * `color-scheme` on <html>, where the library's tokens read them. Runs as a
 * layout effect so a change never paints with the old library colours.
 */
export function useUIThemeBridge(element?: HTMLElement) {
  // MUI swaps in the dark palette's theme when dark mode is on, so the
  // theme's mode is always the resolved one (useColorScheme's can be unset).
  const mode = useTheme().palette.mode;
  const scheme = useEffectiveColorScheme();

  useLayoutEffect(() => {
    applyUITheme(
      { mode, scheme: uiSchemeNames[scheme] },
      element ?? document.documentElement,
    );
  }, [mode, scheme, element]);
}
