import type { TFunction } from "i18next";

import { WorldMapGrid } from "lib/worldMap/grid";

// The grids offered when making a map. Flat-topped hexes are still stored
// and drawn, but are not offered for now.
export const WORLD_MAP_GRIDS: WorldMapGrid[] = ["hex_pointy", "square", "none"];

export function getGridLabel(t: TFunction, grid: WorldMapGrid): string {
  switch (grid) {
    case "hex_pointy":
      return t("worlds.maps.grid-hex-pointy", "Hexes");
    case "hex_flat":
      return t("worlds.maps.grid-hex-flat", "Hexes with flat tops");
    case "square":
      return t("worlds.maps.grid-square", "Squares");
    case "none":
      return t("worlds.maps.grid-none", "No grid");
  }
}

export function getGridDescription(t: TFunction, grid: WorldMapGrid): string {
  return grid === "none"
    ? t(
        "worlds.maps.grid-none-help",
        "Upload an image and place pins on it. Nothing is painted.",
      )
    : t("worlds.maps.grid-paint-help", "Paint terrain and paths cell by cell.");
}
