import { WorldMapChunk, paintedBounds } from "./chunks";
import {
  Bounds,
  Point,
  WorldMapGrid,
  cellAt,
  cellBounds,
  cellCenter,
  unionBounds,
} from "./grid";

// Where a pin is drawn: the centre of the cell it sits in, or exactly where
// it was put on a map without a grid.
export function snapToGrid(grid: WorldMapGrid, point: Point): Point {
  if (grid === "none") return point;
  return cellCenter(grid, cellAt(grid, point));
}

export interface BackgroundRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Everything painted, pinned or underneath, for fitting the view.
export function contentBounds(
  grid: WorldMapGrid,
  chunks: Iterable<WorldMapChunk>,
  pins: Point[],
  background: BackgroundRect | null,
): Bounds | undefined {
  let bounds = grid === "none" ? undefined : paintedBounds(grid, chunks);
  pins.forEach((pin) => {
    bounds = unionBounds(
      bounds,
      grid === "none"
        ? {
            minX: pin.x - 24,
            minY: pin.y - 24,
            maxX: pin.x + 24,
            maxY: pin.y + 24,
          }
        : cellBounds(grid, cellAt(grid, pin)),
    );
  });
  if (background)
    bounds = unionBounds(bounds, {
      minX: background.x,
      minY: background.y,
      maxX: background.x + background.width,
      maxY: background.y + background.height,
    });
  return bounds;
}
