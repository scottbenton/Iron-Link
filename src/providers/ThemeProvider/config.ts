import { ColorScheme } from "@/repositories/shared.types";
import { defineConfig } from "@chakra-ui/react";
import { UtilityValues } from "node_modules/@chakra-ui/react/dist/types/styled-system/generated/prop-types.gen";

export const themeConfig = defineConfig({
  theme: {
    tokens: {
      colors: {},
      fonts: {
        body: { value: '"Figtree Variable", sans-serif' },
        heading: { value: '"Barlow Condensed", sans-serif' },
      },
    },
    semanticTokens: {
      radii: {
        xs: { value: "8px" },
        sm: { value: "12px" },
        md: { value: "16px" },
        lg: { value: "20px" },
        xl: { value: "24px" },
      },
    },
  },
});

export const colorPaletteMap: Record<
  ColorScheme,
  UtilityValues["colorPalette"]
> = {
  [ColorScheme.Default]: "teal",
  [ColorScheme.Cinder]: "red",
  [ColorScheme.Eidolon]: "yellow",
  [ColorScheme.Hinterlands]: "green",
  [ColorScheme.Myriad]: "cyan",
  [ColorScheme.Mystic]: "purple",
};
