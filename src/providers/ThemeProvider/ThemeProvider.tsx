import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { PropsWithChildren } from "react";

import { useEffectiveColorScheme } from "stores/appTheme.store";

import { UIThemeBridge } from "./UIThemeBridge";
import { getTheme } from "./themes/themeConfig";

export function ThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const colorScheme = useEffectiveColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <UIThemeBridge />
      {children}
    </MuiThemeProvider>
  );
}
