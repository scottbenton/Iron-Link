import { Theme as ThemeEnum } from "@/stores/appState.store";
import { useAppState } from "@/stores/appState.store";
import {
  ChakraProvider,
  Theme,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";
import { PropsWithChildren } from "react";

import { colorSchemeMap, themeConfig } from "./config";

const system = createSystem(defaultConfig, themeConfig);

export function ThemeProvider(props: PropsWithChildren) {
  const { children } = props;

  const theme = useAppState((state) => state.theme);
  const colorScheme = useAppState((state) => state.colorScheme);

  return (
    <ChakraProvider value={system}>
      <Theme
        appearance={theme === ThemeEnum.Light ? "light" : "dark"}
        colorPalette={colorSchemeMap[colorScheme]}
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
