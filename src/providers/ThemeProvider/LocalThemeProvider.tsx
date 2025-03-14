import { ColorScheme } from "@/repositories/shared.types";
import { Theme as ThemeEnum, useAppState } from "@/stores/appState.store";
import { Theme } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { colorSchemeMap } from "./config";

export interface LocalThemeProviderProps {
  theme?: ThemeEnum;
  colorScheme?: ColorScheme;
}

export function LocalThemeProvider(
  props: PropsWithChildren<LocalThemeProviderProps>,
) {
  const {
    theme: forcedTheme,
    colorScheme: forcedColorScheme,
    children,
  } = props;

  const theme = useAppState((state) => state.theme);

  return (
    <Theme
      appearance={(forcedTheme ?? theme) === ThemeEnum.Light ? "light" : "dark"}
      colorPalette={
        forcedColorScheme ? colorSchemeMap[forcedColorScheme] : "brand"
      }
    >
      {children}
    </Theme>
  );
}
