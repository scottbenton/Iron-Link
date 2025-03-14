import { Theme as ThemeEnum } from "@/stores/appState.store";
import { useAppState } from "@/stores/appState.store";
import {
  ChakraProvider,
  Theme,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";
import { PropsWithChildren, useMemo } from "react";

import { themeConfig } from "./config";

export function ThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const theme = useAppState((state) => state.theme);
  const colorScheme = useAppState((state) => state.colorScheme);

  const system = useMemo(() => {
    return createSystem(defaultConfig, themeConfig(colorScheme));
  }, [colorScheme]);

  return (
    <ChakraProvider value={system}>
      <Theme
        appearance={theme === ThemeEnum.Light ? "light" : "dark"}
        colorPalette={"brand"}
        minH={"100vh"}
        display="flex"
        flexDirection="column"
        bgColor={"bg.muted"}
      >
        {children}
      </Theme>
    </ChakraProvider>
  );
}
