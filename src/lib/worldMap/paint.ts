import { WorldMapCell } from "./chunks";
import { Cell, PaintableGrid, cellKey, cellLine, cellsInRadius } from "./grid";

// What a stroke does to each cell it touches: the brush paints a terrain
// colour, the path tool lays a path over whatever colour is there, and the
// eraser removes everything, only paths, or only the terrain colour.
export type PaintTool = "brush" | "path" | "eraser";
export type EraserTarget = "all" | "path" | "terrain";

// Brush sizes are radii in cells: one cell, a cell and its ring, two rings.
export const BRUSH_SIZES = [0, 1, 2] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

export interface PaintSettings {
  tool: PaintTool;
  terrain: string;
  size: BrushSize;
  eraser: EraserTarget;
}

export function getBrushCells(
  grid: PaintableGrid,
  center: Cell,
  size: BrushSize,
): Cell[] {
  return cellsInRadius(grid, center, size);
}

// The cells a stroke from one pointer position to the next covers, with the
// brush around each step of the line between them, so a fast stroke leaves no
// gaps. Paths are always one cell wide.
export function getStrokeCells(
  grid: PaintableGrid,
  from: Cell | undefined,
  to: Cell,
  settings: Pick<PaintSettings, "tool" | "size">,
): Cell[] {
  const size = settings.tool === "path" ? 0 : settings.size;
  const line = from ? cellLine(grid, from, to) : [to];
  const cells = new Map<string, Cell>();
  line.forEach((step) =>
    getBrushCells(grid, step, size).forEach((cell) =>
      cells.set(cellKey(cell), cell),
    ),
  );
  return [...cells.values()];
}

// The new value of one cell, or undefined when the tool leaves it as it is.
// Null erases the cell.
export function paintCell(
  existing: WorldMapCell | undefined,
  settings: Pick<PaintSettings, "tool" | "terrain" | "eraser">,
): WorldMapCell | null | undefined {
  switch (settings.tool) {
    case "brush":
      if (existing?.c === settings.terrain) return undefined;
      return { ...existing, c: settings.terrain };
    case "path":
      if (existing?.p) return undefined;
      return { ...existing, p: true };
    case "eraser": {
      if (!existing) return undefined;
      if (settings.eraser === "all") return null;
      const key = settings.eraser === "path" ? "p" : "c";
      if (!existing[key]) return undefined;
      const rest = { ...existing };
      delete rest[key];
      return rest.c || rest.p ? rest : null;
    }
  }
}

// Applies a tool to a set of cells, reading each one's current value.
export function paintCells(
  cells: Cell[],
  read: (cell: Cell) => WorldMapCell | undefined,
  settings: Pick<PaintSettings, "tool" | "terrain" | "eraser">,
): Record<string, WorldMapCell | null> {
  const changes: Record<string, WorldMapCell | null> = {};
  cells.forEach((cell) => {
    const next = paintCell(read(cell), settings);
    if (next !== undefined) changes[cellKey(cell)] = next;
  });
  return changes;
}
