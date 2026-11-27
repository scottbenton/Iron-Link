import { useColorScheme, useTheme } from "@mui/material";

import { SettingsMenuColorMode } from "ui/layout";

/**
 * The app's light or dark mode, which MUI still owns until every screen
 * has moved over (`useUIThemeBridge` hands it to the library). The mode is
 * the theme's resolved one, since `useColorScheme`'s can be unset.
 */
export function useAppColorMode() {
  const { setColorScheme } = useColorScheme();
  const colorMode: SettingsMenuColorMode =
    useTheme().palette.mode === "light" ? "light" : "dark";

  return {
    colorMode,
    setColorMode: (mode: SettingsMenuColorMode) => setColorScheme(mode),
  };
}
