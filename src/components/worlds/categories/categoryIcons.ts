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

import { BUNDLED_GAME_ICONS } from "./bundledGameIcons";
import { RENAMED_GAME_ICON_KEYS, getGameIconKey } from "./gameIconKeys";

// Keep Material icons curated and namespaced so stored keys never collide
// with game-icons keys. Import individual modules to avoid bundling the set.
export const GROUPS_CATEGORY_ICON_KEY = "mui:Groups2";
export const MAP_CATEGORY_ICON_KEY = "mui:Map";
const MATERIAL_CATEGORY_ICON_NAMES: Record<string, string> = {
  [GROUPS_CATEGORY_ICON_KEY]: "Groups",
  [MAP_CATEGORY_ICON_KEY]: "Map",
};
// Listed ahead of the Game Icons in the picker.
export const MATERIAL_CATEGORY_ICON_KEYS = Object.keys(
  MATERIAL_CATEGORY_ICON_NAMES,
);

export function isMaterialCategoryIconKey(key: string) {
  return key in MATERIAL_CATEGORY_ICON_NAMES;
}

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
  iconsPromise ??= import("@iconify-json/game-icons").then(({ icons }) => {
    const set: CategoryIconSet = {};
    for (const [name, icon] of Object.entries(icons.icons)) {
      set[getGameIconKey(name)] = getBodyPaths(icon.body);
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

// Icons the built-in templates use are bundled, so they draw before the set
// has loaded, or without loading it at all. Pass no set to read only those.
export function getCategoryIconPaths(
  icons: CategoryIconSet | undefined,
  key: string,
): GameIconPaths | undefined {
  const canonicalKey = getCanonicalCategoryIconKey(key);
  return icons?.[canonicalKey] ?? BUNDLED_GAME_ICONS[canonicalKey];
}

export function categoryIconName(key: string) {
  const material = MATERIAL_CATEGORY_ICON_NAMES[key];
  if (material) return material;
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
