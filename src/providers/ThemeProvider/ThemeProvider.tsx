import { Theme as ThemeEnum } from "@/stores/appState.store";
import { useAppState } from "@/stores/appState.store";
import {
  ChakraProvider,
  Theme,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { colorPaletteMap, themeConfig } from "./config";

const system = createSystem(defaultConfig, themeConfig);

export function ThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const theme = useAppState((state) => state.theme);
  const colorScheme = useAppState((state) => state.colorScheme);

  return (
    <ChakraProvider value={system}>
      <Theme
        appearance={theme === ThemeEnum.Light ? "light" : "dark"}
        colorPalette={colorPaletteMap[colorScheme]}
        minH="100lvh"
        display="flex"
        flexDirection="column"
        bg="bg.muted"
      >
        {children}
      </Theme>
    </ChakraProvider>
  );
}
