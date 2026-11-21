import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { PropsWithChildren } from "react";

import { useAppState } from "stores/appState.store";

import { UIThemeBridge } from "./UIThemeBridge";
import { getTheme } from "./themes/themeConfig";

export function ThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const colorScheme = useAppState((state) => state.colorScheme);
  const theme = getTheme(colorScheme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <UIThemeBridge />
      {children}
    </MuiThemeProvider>
  );
}
