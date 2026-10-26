// Grid geometry for world maps. Positions are in map units: one unit is a CSS
// pixel at the default cell size. Cells are addressed in each grid's own
// coordinates: axial (q, r) for hexes, (column, row) for squares. The cell at
// (0, 0) is centred on the origin.

export type WorldMapGrid = "hex_pointy" | "hex_flat" | "square" | "none";
export type PaintableGrid = Exclude<WorldMapGrid, "none">;

export interface Point {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const HEX_RADIUS = 24;
const SQRT3 = Math.sqrt(3);
// A square is as wide as a pointy hex, so the default size reads the same.
export const SQUARE_SIZE = HEX_RADIUS * SQRT3;

export function isHexGrid(
  grid: WorldMapGrid,
): grid is "hex_pointy" | "hex_flat" {
  return grid === "hex_pointy" || grid === "hex_flat";
}

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function parseCellKey(key: string): Cell {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

export function cellCenter(grid: PaintableGrid, cell: Cell): Point {
  switch (grid) {
    case "hex_pointy":
      return {
        x: HEX_RADIUS * SQRT3 * (cell.x + cell.y / 2),
        y: HEX_RADIUS * 1.5 * cell.y,
      };
    case "hex_flat":
      return {
        x: HEX_RADIUS * 1.5 * cell.x,
        y: HEX_RADIUS * SQRT3 * (cell.y + cell.x / 2),
      };
    case "square":
      return { x: SQUARE_SIZE * cell.x, y: SQUARE_SIZE * cell.y };
  }
}

function roundAxial(q: number, r: number): Cell {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  // Avoid -0, so keys stay "0,0".
  return { x: rq + 0, y: rr + 0 };
}

export function cellAt(grid: PaintableGrid, point: Point): Cell {
  switch (grid) {
    case "hex_pointy":
      return roundAxial(
        ((SQRT3 / 3) * point.x - point.y / 3) / HEX_RADIUS,
        ((2 / 3) * point.y) / HEX_RADIUS,
      );
    case "hex_flat":
      return roundAxial(
        ((2 / 3) * point.x) / HEX_RADIUS,
        (-point.x / 3 + (SQRT3 / 3) * point.y) / HEX_RADIUS,
      );
    case "square":
      return {
        x: Math.round(point.x / SQUARE_SIZE) + 0,
        y: Math.round(point.y / SQUARE_SIZE) + 0,
      };
  }
}

// Corners in order; edge i runs from corner i to corner i + 1 and faces
// neighbour i in cellNeighbors().
export function cellCorners(grid: PaintableGrid, cell: Cell): Point[] {
  const center = cellCenter(grid, cell);
  if (grid === "square") {
    const h = SQUARE_SIZE / 2;
    return [
      { x: center.x + h, y: center.y - h },
      { x: center.x + h, y: center.y + h },
      { x: center.x - h, y: center.y + h },
      { x: center.x - h, y: center.y - h },
    ];
  }
  const start = grid === "hex_pointy" ? -30 : 0;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((start + 60 * i) * Math.PI) / 180;
    return {
      x: center.x + HEX_RADIUS * Math.cos(angle),
      y: center.y + HEX_RADIUS * Math.sin(angle),
    };
  });
}

const HEX_DIRECTIONS: Cell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];
const SQUARE_DIRECTIONS: Cell[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function cellNeighbors(grid: PaintableGrid, cell: Cell): Cell[] {
  return (grid === "square" ? SQUARE_DIRECTIONS : HEX_DIRECTIONS).map((d) => ({
    x: cell.x + d.x,
    y: cell.y + d.y,
  }));
}

export function cellDistance(grid: PaintableGrid, a: Cell, b: Cell): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  if (grid === "square") return Math.max(Math.abs(dx), Math.abs(dy));
  return (Math.abs(dx) + Math.abs(dx + dy) + Math.abs(dy)) / 2;
}

// Every cell from a to b, so a fast stroke leaves no gaps.
export function cellLine(grid: PaintableGrid, a: Cell, b: Cell): Cell[] {
  const steps = cellDistance(grid, a, b);
  if (steps === 0) return [a];
  const cells: Cell[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // A nudge keeps points on an edge from rounding both ways along the line.
    const x = a.x + (b.x - a.x) * t + 1e-6;
    const y = a.y + (b.y - a.y) * t + 1e-6;
    cells.push(
      grid === "square"
        ? { x: Math.round(x) + 0, y: Math.round(y) + 0 }
        : roundAxial(x, y),
    );
  }
  return cells;
}

// The cells within `radius` steps of a centre: a hex for hexes, a square for
// squares.
export function cellsInRadius(
  grid: PaintableGrid,
  center: Cell,
  radius: number,
): Cell[] {
  const cells: Cell[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const cell = { x: center.x + dx, y: center.y + dy };
      if (cellDistance(grid, center, cell) <= radius) cells.push(cell);
    }
  }
  return cells;
}

// The cells whose centres fall in (or just around) a rectangle, for drawing
// the grid over what is on screen.
export function cellsInBounds(grid: PaintableGrid, bounds: Bounds): Cell[] {
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY },
  ].map((point) => cellAt(grid, point));
  const minX = Math.min(...corners.map((c) => c.x)) - 1;
  const maxX = Math.max(...corners.map((c) => c.x)) + 1;
  const minY = Math.min(...corners.map((c) => c.y)) - 1;
  const maxY = Math.max(...corners.map((c) => c.y)) + 1;
  const pad = cellPadding(grid);
  const cells: Cell[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const center = cellCenter(grid, { x, y });
      if (
        center.x >= bounds.minX - pad &&
        center.x <= bounds.maxX + pad &&
        center.y >= bounds.minY - pad &&
        center.y <= bounds.maxY + pad
      )
        cells.push({ x, y });
    }
  }
  return cells;
}

// How far a cell reaches from its centre.
export function cellPadding(grid: PaintableGrid): number {
  return grid === "square" ? SQUARE_SIZE / Math.SQRT2 : HEX_RADIUS;
}

// Hex flowers are clusters of 19 hexes (a centre and two rings) that tile the
// plane. Flower centres sit on the lattice spanned by (5, -2) and (2, 3).
export function hexFlowerOf(cell: Cell): string {
  const i = (3 * cell.x - 2 * cell.y) / 19;
  const j = (2 * cell.x + 5 * cell.y) / 19;
  for (let di = Math.floor(i) - 1; di <= Math.ceil(i) + 1; di++) {
    for (let dj = Math.floor(j) - 1; dj <= Math.ceil(j) + 1; dj++) {
      const center = { x: 5 * di + 2 * dj, y: -2 * di + 3 * dj };
      if (cellDistance("hex_pointy", center, cell) <= 2) return `${di},${dj}`;
    }
  }
  return "";
}

export function unionBounds(
  a: Bounds | undefined,
  b: Bounds | undefined,
): Bounds | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function cellBounds(grid: PaintableGrid, cell: Cell): Bounds {
  const center = cellCenter(grid, cell);
  const pad = cellPadding(grid);
  return {
    minX: center.x - pad,
    minY: center.y - pad,
    maxX: center.x + pad,
    maxY: center.y + pad,
  };
}
