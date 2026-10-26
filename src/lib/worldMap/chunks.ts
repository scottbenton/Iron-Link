import {
  Bounds,
  Cell,
  PaintableGrid,
  cellBounds,
  parseCellKey,
  unionBounds,
} from "./grid";

// Painted cells are stored 16 by 16 in chunks, the same split the database
// uses (world_map_chunks), and drawn a chunk at a time.
export const CHUNK_SIZE = 16;

// A painted cell: a terrain colour key, a path, or both.
export interface WorldMapCell {
  c?: string;
  p?: true;
}

export type WorldMapCells = Record<string, WorldMapCell>;

export interface WorldMapChunk {
  x: number;
  y: number;
  cells: WorldMapCells;
  version: number;
}

export function chunkOf(cell: Cell): Cell {
  return {
    x: Math.floor(cell.x / CHUNK_SIZE),
    y: Math.floor(cell.y / CHUNK_SIZE),
  };
}

export function chunkKey(chunk: Cell): string {
  return `${chunk.x},${chunk.y}`;
}

// The area a chunk can draw into. For hexes a chunk is a parallelogram, which
// its four corner cells bound.
export function chunkBounds(grid: PaintableGrid, chunk: Cell): Bounds {
  const x0 = chunk.x * CHUNK_SIZE;
  const y0 = chunk.y * CHUNK_SIZE;
  const x1 = x0 + CHUNK_SIZE - 1;
  const y1 = y0 + CHUNK_SIZE - 1;
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x0, y: y1 },
    { x: x1, y: y1 },
  ].reduce<Bounds | undefined>(
    (bounds, cell) => unionBounds(bounds, cellBounds(grid, cell)),
    undefined,
  )!;
}

// The bounds of everything painted, cell by cell.
export function paintedBounds(
  grid: PaintableGrid,
  chunks: Iterable<WorldMapChunk>,
): Bounds | undefined {
  let bounds: Bounds | undefined;
  for (const chunk of chunks) {
    for (const key of Object.keys(chunk.cells)) {
      bounds = unionBounds(bounds, cellBounds(grid, parseCellKey(key)));
    }
  }
  return bounds;
}

export function isWorldMapCell(value: unknown): value is WorldMapCell {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const cell = value as Record<string, unknown>;
  const keys = Object.keys(cell);
  return (
    keys.length > 0 &&
    keys.every((key) => key === "c" || key === "p") &&
    (cell.c === undefined || typeof cell.c === "string") &&
    (cell.p === undefined || cell.p === true)
  );
}
