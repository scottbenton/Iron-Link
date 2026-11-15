// Terrain colours a cell can be painted with. The keys are stored in each
// cell, and match Iron Fellowship's, so old maps keep their colours.
export interface WorldMapTerrain {
  key: string;
  color: string;
}

export const WORLD_MAP_TERRAINS: WorldMapTerrain[] = [
  { key: "grass", color: "#576e3b" },
  { key: "treeCover", color: "#3d532d" },
  { key: "water", color: "#415c6b" },
  { key: "sand", color: "#caa967" },
  { key: "dirt", color: "#533f28" },
  { key: "rock", color: "#5b5b53" },
  { key: "snow", color: "#b4bfbf" },
  { key: "mesa", color: "#a25339" },
  { key: "cherry", color: "#a96098" },
  { key: "magma", color: "#bb4a2a" },
  { key: "amethyst", color: "#734fba" },
  { key: "basalt", color: "#27272a" },
];

const TERRAIN_COLORS = Object.fromEntries(
  WORLD_MAP_TERRAINS.map((terrain) => [terrain.key, terrain.color]),
);

// A key this build does not know still draws, in neutral grey.
export function getTerrainColor(key: string): string {
  return TERRAIN_COLORS[key] ?? "#6b6b6b";
}

export const WORLD_MAP_BACKGROUND = "#1c1d22";
export const WORLD_MAP_PATH_COLOR = "#e8d9b0";
