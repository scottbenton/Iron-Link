import {
  Camera,
  ViewSize,
  boundsIntersect,
  visibleBounds,
} from "lib/worldMap/camera";
import {
  WorldMapCell,
  WorldMapChunk,
  chunkBounds,
  chunkKey,
  chunkOf,
} from "lib/worldMap/chunks";
import {
  Bounds,
  Cell,
  HEX_RADIUS,
  PaintableGrid,
  SQUARE_SIZE,
  cellCenter,
  cellCorners,
  cellKey,
  cellNeighbors,
  cellsInBounds,
  hexFlowerOf,
  isHexGrid,
  parseCellKey,
} from "lib/worldMap/grid";
import {
  WORLD_MAP_BACKGROUND,
  WORLD_MAP_PATH_COLOR,
  getTerrainColor,
} from "lib/worldMap/terrain";

export interface WorldMapBackgroundImage {
  image: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorldMapScene {
  grid: PaintableGrid | "none";
  chunks: Map<string, WorldMapChunk>;
  hexFlowers: boolean;
  background: WorldMapBackgroundImage | null;
  // Cells outlined under the pointer: the brush, or the cell a pin will land.
  highlight?: Cell[];
}

// Grid lines show once a cell is this many pixels across.
const GRID_MIN_PIXELS = 10;
const FLOWER_MIN_PIXELS = 4;
// Below the default size each chunk is drawn once into its own canvas, at a
// power of two at or above the scale, and reused until it changes.
const CACHE_MAX_SCALE = 1;
const CACHE_MIN_SCALE = 1 / 32;

export function getCell(
  chunks: Map<string, WorldMapChunk>,
  cell: Cell,
): WorldMapCell | undefined {
  return chunks.get(chunkKey(chunkOf(cell)))?.cells[cellKey(cell)];
}

function traceCell(
  ctx: CanvasRenderingContext2D | Path2D,
  grid: PaintableGrid,
  cell: Cell,
) {
  const corners = cellCorners(grid, cell);
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++)
    ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
}

// Draws one chunk's cells in map units. Paths run from a cell's centre
// towards each neighbouring path, so they join across chunk edges.
function drawChunkCells(
  ctx: CanvasRenderingContext2D,
  grid: PaintableGrid,
  chunk: WorldMapChunk,
  chunks: Map<string, WorldMapChunk>,
) {
  const byColor = new Map<string, Path2D>();
  const paths: Cell[] = [];
  Object.entries(chunk.cells).forEach(([key, value]) => {
    const cell = parseCellKey(key);
    if (value.c) {
      let path = byColor.get(value.c);
      if (!path) {
        path = new Path2D();
        byColor.set(value.c, path);
      }
      traceCell(path, grid, cell);
    }
    if (value.p) paths.push(cell);
  });
  byColor.forEach((path, color) => {
    ctx.fillStyle = getTerrainColor(color);
    ctx.fill(path);
    // A hairline of the same colour hides the seams between cells.
    ctx.strokeStyle = getTerrainColor(color);
    ctx.lineWidth = 1;
    ctx.stroke(path);
  });
  if (paths.length === 0) return;
  const size = grid === "square" ? SQUARE_SIZE : HEX_RADIUS;
  ctx.strokeStyle = WORLD_MAP_PATH_COLOR;
  ctx.fillStyle = WORLD_MAP_PATH_COLOR;
  ctx.lineWidth = size * 0.22;
  ctx.lineCap = "round";
  ctx.beginPath();
  paths.forEach((cell) => {
    const center = cellCenter(grid, cell);
    let joined = false;
    cellNeighbors(grid, cell).forEach((neighbor) => {
      if (!getCell(chunks, neighbor)?.p) return;
      const other = cellCenter(grid, neighbor);
      ctx.moveTo(center.x, center.y);
      ctx.lineTo((center.x + other.x) / 2, (center.y + other.y) / 2);
      joined = true;
    });
    if (!joined) {
      ctx.moveTo(center.x + size * 0.18, center.y);
      ctx.arc(center.x, center.y, size * 0.18, 0, Math.PI * 2);
    }
  });
  ctx.stroke();
}

interface CachedChunk {
  level: number;
  canvas: HTMLCanvasElement;
  bounds: Bounds;
  // The chunk and its neighbours as drawn; paths depend on the neighbours.
  sources: (WorldMapChunk | undefined)[];
}

function neighborChunks(
  chunk: WorldMapChunk,
  chunks: Map<string, WorldMapChunk>,
): (WorldMapChunk | undefined)[] {
  const sources: (WorldMapChunk | undefined)[] = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      sources.push(chunks.get(chunkKey({ x: chunk.x + dx, y: chunk.y + dy })));
  return sources;
}

export class ChunkCache {
  private cached = new Map<string, CachedChunk>();
  private grid: PaintableGrid | null = null;

  get(
    grid: PaintableGrid,
    chunk: WorldMapChunk,
    chunks: Map<string, WorldMapChunk>,
    level: number,
  ): CachedChunk | undefined {
    if (grid !== this.grid) {
      this.cached.clear();
      this.grid = grid;
    }
    const key = chunkKey(chunk);
    const sources = neighborChunks(chunk, chunks);
    const held = this.cached.get(key);
    if (
      held &&
      held.level === level &&
      held.sources.every((source, i) => source === sources[i])
    )
      return held;
    const bounds = chunkBounds(grid, chunk);
    const canvas = held?.canvas ?? document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) * level));
    canvas.height = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) * level));
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.setTransform(
      level,
      0,
      0,
      level,
      -bounds.minX * level,
      -bounds.minY * level,
    );
    ctx.clearRect(
      bounds.minX,
      bounds.minY,
      bounds.maxX - bounds.minX,
      bounds.maxY - bounds.minY,
    );
    drawChunkCells(ctx, grid, chunk, chunks);
    const entry = { level, canvas, bounds, sources };
    this.cached.set(key, entry);
    return entry;
  }

  // Forgets chunks that are gone.
  prune(chunks: Map<string, WorldMapChunk>) {
    this.cached.forEach((_, key) => {
      if (!chunks.has(key)) this.cached.delete(key);
    });
  }
}

function cacheLevel(scale: number): number {
  return Math.max(
    CACHE_MIN_SCALE,
    Math.min(CACHE_MAX_SCALE, 2 ** Math.ceil(Math.log2(scale))),
  );
}

// Draws the map as the camera sees it. Only chunks on screen are drawn.
export function drawWorldMap(
  ctx: CanvasRenderingContext2D,
  view: ViewSize,
  pixelRatio: number,
  camera: Camera,
  scene: WorldMapScene,
  cache: ChunkCache,
) {
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.fillStyle = WORLD_MAP_BACKGROUND;
  ctx.fillRect(0, 0, view.width, view.height);
  // From here on, draw in map units.
  ctx.setTransform(
    pixelRatio * camera.scale,
    0,
    0,
    pixelRatio * camera.scale,
    pixelRatio * (view.width / 2 - camera.x * camera.scale),
    pixelRatio * (view.height / 2 - camera.y * camera.scale),
  );
  const visible = visibleBounds(camera, view);

  if (scene.background) {
    const { image, x, y, width, height } = scene.background;
    ctx.drawImage(image, x, y, width, height);
  }
  const grid = scene.grid;
  if (grid === "none") return;

  const cached = camera.scale <= CACHE_MAX_SCALE;
  const level = cacheLevel(camera.scale);
  scene.chunks.forEach((chunk) => {
    const bounds = chunkBounds(grid, chunk);
    if (!boundsIntersect(bounds, visible)) return;
    if (cached) {
      const entry = cache.get(grid, chunk, scene.chunks, level);
      if (entry)
        ctx.drawImage(
          entry.canvas,
          entry.bounds.minX,
          entry.bounds.minY,
          entry.bounds.maxX - entry.bounds.minX,
          entry.bounds.maxY - entry.bounds.minY,
        );
    } else {
      drawChunkCells(ctx, grid, chunk, scene.chunks);
    }
  });

  const cellPixels =
    (grid === "square" ? SQUARE_SIZE : HEX_RADIUS * 2) * camera.scale;
  const showGrid = cellPixels >= GRID_MIN_PIXELS;
  const showFlowers =
    scene.hexFlowers && isHexGrid(grid) && cellPixels >= FLOWER_MIN_PIXELS;
  if (showGrid || showFlowers) {
    const cells = cellsInBounds(grid, visible);
    if (showGrid) {
      const lines = new Path2D();
      cells.forEach((cell) => traceCell(lines, grid, cell));
      ctx.strokeStyle = scene.background
        ? "rgba(0, 0, 0, 0.45)"
        : "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1 / camera.scale;
      ctx.stroke(lines);
    }
    if (showFlowers) {
      const outline = new Path2D();
      cells.forEach((cell) => {
        const flower = hexFlowerOf(cell);
        const corners = cellCorners(grid, cell);
        cellNeighbors(grid, cell).forEach((neighbor, i) => {
          // Each shared edge is drawn once, from the cell on its lower side.
          if (i > 2 || hexFlowerOf(neighbor) === flower) return;
          const a = corners[i];
          const b = corners[(i + 1) % corners.length];
          outline.moveTo(a.x, a.y);
          outline.lineTo(b.x, b.y);
        });
      });
      ctx.strokeStyle = "rgba(255, 236, 179, 0.7)";
      ctx.lineWidth = Math.max(2, 2.5 / camera.scale);
      ctx.lineCap = "round";
      ctx.stroke(outline);
    }
  }

  if (scene.highlight?.length) {
    const outline = new Path2D();
    scene.highlight.forEach((cell) => traceCell(outline, grid, cell));
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fill(outline);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5 / camera.scale;
    ctx.stroke(outline);
  }
}

// Draws every painted cell as a dot of its colour, for the minimap.
export function drawMinimapCells(
  ctx: CanvasRenderingContext2D,
  grid: PaintableGrid,
  chunks: Iterable<WorldMapChunk>,
  scale: number,
) {
  const size = Math.max(
    1 / scale,
    grid === "square" ? SQUARE_SIZE : HEX_RADIUS * 1.8,
  );
  for (const chunk of chunks) {
    Object.entries(chunk.cells).forEach(([key, value]) => {
      const center = cellCenter(grid, parseCellKey(key));
      ctx.fillStyle = value.c ? getTerrainColor(value.c) : WORLD_MAP_PATH_COLOR;
      ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
    });
  }
}
