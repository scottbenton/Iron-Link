import {
  blue,
  brown,
  green,
  grey,
  orange,
  pink,
  purple,
  red,
  yellow,
} from "@mui/material/colors";
import type { IconType } from "react-icons";

import { IconColors } from "types/Icon.type";

// Keep Material icons curated and namespaced so stored keys never collide
// with game-icons keys. Import individual modules to avoid bundling the set.
export const GROUPS_CATEGORY_ICON_KEY = "mui:Groups2";

let iconsPromise: Promise<Record<string, IconType>> | undefined;
export function loadCategoryIcons() {
  iconsPromise ??= import("react-icons/gi").then(
    (icons) =>
      Object.fromEntries(
        Object.entries(icons).filter(([key]) => key.startsWith("Gi")),
      ) as Record<string, IconType>,
  );
  return iconsPromise;
}

export function categoryIconName(key: string) {
  if (key === GROUPS_CATEGORY_ICON_KEY) return "Groups";
  return key.replace(/^Gi/, "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

const categoryIconPalettes = {
  pink,
  red,
  orange,
  yellow,
  green,
  blue,
  purple,
  brown,
};

// Shades readable on the current background. "White" is the high-contrast
// default (dark on light themes) and grey is a muted mid-tone, so the two
// stay distinguishable in both modes.
export function getCategoryIconColor(
  color: IconColors | null | undefined,
  mode: "light" | "dark",
) {
  const dark = mode === "dark";
  if (color === IconColors.White) return dark ? grey[50] : grey[900];
  if (!color || color === IconColors.Grey) return dark ? grey[400] : grey[600];
  return (categoryIconPalettes[color] ?? grey)[dark ? 200 : 800];
}
