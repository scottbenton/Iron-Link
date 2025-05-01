import { ColorScheme } from "@/repositories/shared.types";
import { defineConfig } from "@chakra-ui/react";

import {
  cyan,
  gray,
  green,
  orange,
  pink,
  purple,
  red,
  sky,
  yellow,
} from "./colorConstants";

export const themeConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        gray,
        pink,
        red,
        orange,
        yellow,
        green,
        cyan,
        blue: sky,
        purple,
      },
      fonts: {
        body: { value: '"Figtree Variable", sans-serif' },
        heading: { value: '"Barlow Condensed", sans-serif' },
      },
    },
    semanticTokens: {
      radii: {
        xs: { value: "0px" },
        sm: { value: "4px" },
        md: { value: "8px" },
        lg: { value: "12px" },
        xl: { value: "16px" },
      },
    },
  },
});

export const colorSchemeMap: Record<ColorScheme, string> = {
  [ColorScheme.Default]: "pink",
  [ColorScheme.Cinder]: "red",
  [ColorScheme.Eidolon]: "yellow",
  [ColorScheme.Hinterlands]: "green",
  [ColorScheme.Myriad]: "blue",
  [ColorScheme.Mystic]: "purple",
};
