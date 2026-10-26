import { describe, expect, it } from "vitest";

import { DEFAULT_CAMERA, fitCamera, screenToMap, zoomAt } from "../camera";
import { chunkBounds, chunkOf, paintedBounds } from "../chunks";
import {
  PaintableGrid,
  cellAt,
  cellCenter,
  cellCorners,
  cellDistance,
  cellLine,
  cellNeighbors,
  cellsInRadius,
  hexFlowerOf,
} from "../grid";

const grids: PaintableGrid[] = ["hex_pointy", "hex_flat", "square"];

describe("world map grids", () => {
  it.each(grids)("finds the cell under its own centre (%s)", (grid) => {
    for (let x = -5; x <= 5; x++)
      for (let y = -5; y <= 5; y++)
        expect(cellAt(grid, cellCenter(grid, { x, y }))).toEqual({ x, y });
  });

  it.each(grids)("faces each edge towards its neighbour (%s)", (grid) => {
    const cell = { x: 2, y: -3 };
    const corners = cellCorners(grid, cell);
    const center = cellCenter(grid, cell);
    cellNeighbors(grid, cell).forEach((neighbor, i) => {
      const a = corners[i];
      const b = corners[(i + 1) % corners.length];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      // A point just past the edge's midpoint lies in that neighbour.
      const outside = {
        x: mid.x + (mid.x - center.x) * 0.2,
        y: mid.y + (mid.y - center.y) * 0.2,
      };
      expect(cellAt(grid, outside)).toEqual(neighbor);
    });
  });

  it.each(grids)("draws lines without gaps (%s)", (grid) => {
    const line = cellLine(grid, { x: -4, y: 1 }, { x: 5, y: -3 });
    expect(line[0]).toEqual({ x: -4, y: 1 });
    expect(line[line.length - 1]).toEqual({ x: 5, y: -3 });
    for (let i = 1; i < line.length; i++)
      expect(cellDistance(grid, line[i - 1], line[i])).toBe(1);
  });

  it("brushes a hex of cells on hex grids and a square on squares", () => {
    expect(cellsInRadius("hex_pointy", { x: 0, y: 0 }, 1)).toHaveLength(7);
    expect(cellsInRadius("hex_flat", { x: 0, y: 0 }, 2)).toHaveLength(19);
    expect(cellsInRadius("square", { x: 0, y: 0 }, 1)).toHaveLength(9);
  });

  it("groups hexes into flowers of 19", () => {
    const sizes: Record<string, number> = {};
    for (let x = -60; x <= 60; x++)
      for (let y = -60; y <= 60; y++) {
        const flower = hexFlowerOf({ x, y });
        expect(flower).not.toBe("");
        sizes[flower] = (sizes[flower] ?? 0) + 1;
      }
    expect(hexFlowerOf({ x: 0, y: 0 })).toBe("0,0");
    // A flower is its centre and the two rings around it.
    expect(
      cellsInRadius("hex_pointy", { x: 0, y: 0 }, 2).map(hexFlowerOf),
    ).toEqual(Array(19).fill("0,0"));
    expect(hexFlowerOf({ x: 3, y: 0 })).not.toBe("0,0");
    expect(sizes["0,0"]).toBe(19);
    expect(sizes["1,1"]).toBe(19);
  });

  it("splits cells into chunks of 16, including negative ones", () => {
    expect(chunkOf({ x: 0, y: 15 })).toEqual({ x: 0, y: 0 });
    expect(chunkOf({ x: -1, y: 16 })).toEqual({ x: -1, y: 1 });
    const bounds = chunkBounds("square", { x: 0, y: 0 });
    expect(bounds.minX).toBeLessThan(0);
    expect(bounds.maxX).toBeGreaterThan(
      cellCenter("square", { x: 15, y: 0 }).x,
    );
  });
});

describe("world map camera", () => {
  const view = { width: 800, height: 600 };

  it("opens an empty map at the default size", () => {
    expect(fitCamera(undefined, view)).toEqual(DEFAULT_CAMERA);
  });

  it("fits content without zooming past the default size", () => {
    const small = fitCamera(
      paintedBounds("hex_pointy", [
        { x: 0, y: 0, version: 1, cells: { "0,0": { c: "grass" } } },
      ]),
      view,
    );
    expect(small.scale).toBe(1);
    const large = fitCamera(
      { minX: -4000, minY: -100, maxX: 4000, maxY: 100 },
      view,
    );
    expect(large.scale).toBeCloseTo(704 / 8000);
    expect(large.x).toBe(0);
  });

  it("zooms around the pointer", () => {
    const anchor = { x: 100, y: 450 };
    const before = screenToMap(DEFAULT_CAMERA, view, anchor);
    const zoomed = zoomAt(DEFAULT_CAMERA, view, anchor, 2);
    expect(zoomed.scale).toBe(2);
    const after = screenToMap(zoomed, view, anchor);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});
