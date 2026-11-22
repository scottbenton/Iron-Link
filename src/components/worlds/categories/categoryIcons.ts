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

import { IconColors } from "types/Icon.type";

import { RENAMED_GAME_ICON_KEYS, getGameIconKey } from "./gameIconKeys";

// Keep Material icons curated and namespaced so stored keys never collide
// with game-icons keys. Import individual modules to avoid bundling the set.
export const GROUPS_CATEGORY_ICON_KEY = "mui:Groups2";

// A game icon is the d attribute of each of its paths, drawn in a 512 box.
export type GameIconPaths = string[];
export type CategoryIconSet = Record<string, GameIconPaths>;

// Iconify bodies are plain <path fill="currentColor" d="..."/> elements, so
// only their d attributes are kept and nothing is set as HTML.
function getBodyPaths(body: string) {
  return Array.from(body.matchAll(/\sd="([^"]*)"/g), (match) => match[1]);
}

let loadedIcons: CategoryIconSet | undefined;
let iconsPromise: Promise<CategoryIconSet> | undefined;
export function loadCategoryIcons() {
  iconsPromise ??= Promise.all([
    import("@iconify-json/game-icons"),
    import("./legacyGameIconPaths"),
  ]).then(([{ icons }, { LEGACY_GAME_ICON_PATHS }]) => {
    const set: CategoryIconSet = {};
    for (const [name, icon] of Object.entries(icons.icons)) {
      const key = getGameIconKey(name);
      set[key] = LEGACY_GAME_ICON_PATHS[key] ?? getBodyPaths(icon.body);
    }
    loadedIcons = set;
    return set;
  });
  return iconsPromise;
}

// The icon set once any load has finished. Reading it synchronously lets a
// newly mounted icon render immediately instead of flashing a placeholder.
export function getLoadedCategoryIcons() {
  return loadedIcons;
}

// The key the icon set lists a stored key under. Keys of icons Iconify
// renamed stay stored as they are and read as the new name.
export function getCanonicalCategoryIconKey(key: string) {
  return RENAMED_GAME_ICON_KEYS[key] ?? key;
}

export function getCategoryIconPaths(
  icons: CategoryIconSet | undefined,
  key: string,
): GameIconPaths | undefined {
  return icons?.[getCanonicalCategoryIconKey(key)];
}

export function categoryIconName(key: string) {
  if (key === GROUPS_CATEGORY_ICON_KEY) return "Groups";
  return getCanonicalCategoryIconKey(key)
    .replace(/^Gi/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
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
