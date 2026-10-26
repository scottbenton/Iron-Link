import { TFunction } from "i18next";

import { PaintTool } from "lib/worldMap/paint";

// The tool in hand: panning, one of the paint tools, or moving the
// background image.
export type WorldMapTool = "pan" | PaintTool | "background";

export function isPaintTool(tool: WorldMapTool): tool is PaintTool {
  return tool === "brush" || tool === "path" || tool === "eraser";
}

export function getTerrainLabel(t: TFunction, key: string): string {
  switch (key) {
    case "grass":
      return t("worlds.maps.terrain.grass", "Grass");
    case "treeCover":
      return t("worlds.maps.terrain.tree-cover", "Forest");
    case "water":
      return t("worlds.maps.terrain.water", "Water");
    case "sand":
      return t("worlds.maps.terrain.sand", "Sand");
    case "dirt":
      return t("worlds.maps.terrain.dirt", "Dirt");
    case "rock":
      return t("worlds.maps.terrain.rock", "Rock");
    case "snow":
      return t("worlds.maps.terrain.snow", "Snow");
    case "mesa":
      return t("worlds.maps.terrain.mesa", "Mesa");
    case "cherry":
      return t("worlds.maps.terrain.cherry", "Blossom");
    case "magma":
      return t("worlds.maps.terrain.magma", "Magma");
    case "amethyst":
      return t("worlds.maps.terrain.amethyst", "Amethyst");
    case "basalt":
      return t("worlds.maps.terrain.basalt", "Basalt");
    default:
      return key;
  }
}
