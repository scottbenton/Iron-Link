import { WorldMapCell } from "./chunks";
import {
  Cell,
  PaintableGrid,
  cellKey,
  cellLine,
  cellNeighbors,
  cellsInRadius,
} from "./grid";

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
      return { ...existing, p: PATH };
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

// What a click (a stroke that never leaves its cell) does: the path tool
// clicked on a path takes it away; otherwise it paints as usual.
export function getTapSettings(
  settings: PaintSettings,
  startCell: WorldMapCell | undefined,
): PaintSettings {
  return settings.tool === "path" && startCell?.p
    ? { ...settings, tool: "eraser", eraser: "path", size: 0 }
    : settings;
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

// A path cell's `p` is PATH plus a bit for each neighbour the path runs to,
// in the order of pathDirections, so a road joins the cells it was drawn
// through rather than every path beside it. Paths saved as `true` join every
// side-by-side neighbour, as they always have.
export const PATH = 256;

// Hexes link to their six neighbours; squares to their four sides first and
// then their four corners, so a diagonal stroke stays one road.
const SQUARE_PATH_DIRECTIONS: Cell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
];

export function pathDirections(grid: PaintableGrid): Cell[] {
  return grid === "square"
    ? SQUARE_PATH_DIRECTIONS
    : cellNeighbors(grid, { x: 0, y: 0 });
}

// The links of a path cell as a bit mask over pathDirections.
export function pathLinks(grid: PaintableGrid, p: WorldMapCell["p"]): number {
  if (p === undefined) return 0;
  // Old paths: every side-by-side neighbour (the first four on squares).
  if (p === true) return grid === "square" ? 0b1111 : 0b111111;
  return p & (PATH - 1);
}

function directionIndex(grid: PaintableGrid, from: Cell, to: Cell): number {
  return pathDirections(grid).findIndex(
    (d) => from.x + d.x === to.x && from.y + d.y === to.y,
  );
}

// Whether the paths in two neighbouring cells join: both must link to the
// other.
export function pathsJoin(
  grid: PaintableGrid,
  a: Cell,
  aValue: WorldMapCell | undefined,
  b: Cell,
  bValue: WorldMapCell | undefined,
): boolean {
  const ab = directionIndex(grid, a, b);
  const ba = directionIndex(grid, b, a);
  return (
    ab >= 0 &&
    ba >= 0 &&
    !!(pathLinks(grid, aValue?.p) & (1 << ab)) &&
    !!(pathLinks(grid, bValue?.p) & (1 << ba))
  );
}

// Lays a path along cells in the order they were drawn, linking each to the
// next. Only cells whose path changes are returned.
export function paintPath(
  grid: PaintableGrid,
  line: Cell[],
  read: (cell: Cell) => WorldMapCell | undefined,
): Record<string, WorldMapCell> {
  const links = new Map<string, { cell: Cell; bits: number }>();
  const add = (cell: Cell, bits: number) => {
    const key = cellKey(cell);
    const held = links.get(key) ?? { cell, bits: 0 };
    held.bits |= bits;
    links.set(key, held);
  };
  line.forEach((cell, i) => {
    add(cell, 0);
    const next = line[i + 1];
    if (!next) return;
    const there = directionIndex(grid, cell, next);
    const back = directionIndex(grid, next, cell);
    if (there < 0 || back < 0) return;
    add(cell, 1 << there);
    add(next, 1 << back);
  });
  const changes: Record<string, WorldMapCell> = {};
  links.forEach(({ cell, bits }, key) => {
    const existing = read(cell);
    const p = PATH | pathLinks(grid, existing?.p) | bits;
    if (existing?.p === p) return;
    changes[key] = { ...existing, p };
  });
  return changes;
}
