// @vitest-environment node
import { describe, expect, it } from "vitest";

import { WorldMapCell } from "../chunks";
import { Cell, cellKey } from "../grid";
import {
  PATH,
  PaintSettings,
  getStrokeCells,
  getTapSettings,
  paintCell,
  paintCells,
  paintPath,
  pathsJoin,
} from "../paint";

describe("paintCell", () => {
  const brush = { tool: "brush", terrain: "water", eraser: "all" } as const;
  const path = { tool: "path", terrain: "water", eraser: "all" } as const;

  it("paints colour and keeps a path", () => {
    expect(paintCell(undefined, brush)).toEqual({ c: "water" });
    expect(paintCell({ c: "grass", p: true }, brush)).toEqual({
      c: "water",
      p: true,
    });
    expect(paintCell({ c: "water" }, brush)).toBeUndefined();
  });

  it("lays a path and keeps the colour", () => {
    expect(paintCell({ c: "grass" }, path)).toEqual({ c: "grass", p: PATH });
    expect(paintCell({ p: true }, path)).toBeUndefined();
  });

  it("erases everything, only paths or only terrain", () => {
    expect(
      paintCell({ c: "grass", p: true }, { ...brush, tool: "eraser" }),
    ).toBeNull();
    expect(paintCell(undefined, { ...brush, tool: "eraser" })).toBeUndefined();
    const pathEraser = { ...brush, tool: "eraser", eraser: "path" } as const;
    expect(paintCell({ c: "grass", p: true }, pathEraser)).toEqual({
      c: "grass",
    });
    expect(paintCell({ p: true }, pathEraser)).toBeNull();
    expect(paintCell({ c: "grass" }, pathEraser)).toBeUndefined();
    const terrainEraser = {
      ...brush,
      tool: "eraser",
      eraser: "terrain",
    } as const;
    expect(paintCell({ c: "grass", p: true }, terrainEraser)).toEqual({
      p: true,
    });
    expect(paintCell({ c: "grass" }, terrainEraser)).toBeNull();
    expect(paintCell({ p: true }, terrainEraser)).toBeUndefined();
  });
});

describe("getStrokeCells", () => {
  it("fills the gap between two pointer positions", () => {
    const cells = getStrokeCells(
      "hex_pointy",
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { tool: "brush", size: 0 },
    );
    expect(cells.map(cellKey).sort()).toEqual(
      ["0,0", "1,0", "2,0", "3,0", "4,0"].sort(),
    );
  });

  it("covers the brush around each step without repeats", () => {
    const cells = getStrokeCells(
      "hex_pointy",
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { tool: "brush", size: 1 },
    );
    // Two overlapping 7-hex brushes share 4 cells.
    expect(cells).toHaveLength(10);
    expect(new Set(cells.map(cellKey)).size).toBe(10);
  });

  it("draws paths one cell wide", () => {
    expect(
      getStrokeCells(
        "square",
        undefined,
        { x: 2, y: 2 },
        {
          tool: "path",
          size: 2,
        },
      ),
    ).toEqual([{ x: 2, y: 2 }]);
  });
});

describe("paintCells", () => {
  it("returns only the cells that change", () => {
    const stored: Record<string, { c: string }> = { "0,0": { c: "water" } };
    expect(
      paintCells(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        (cell) => stored[cellKey(cell)],
        { tool: "brush", terrain: "water", eraser: "all" },
      ),
    ).toEqual({ "1,0": { c: "water" } });
  });
});

describe("getTapSettings", () => {
  const path: PaintSettings = {
    tool: "path",
    terrain: "grass",
    size: 2,
    eraser: "all",
  };

  it("draws paths when the tap is off a path", () => {
    expect(getTapSettings(path, undefined)).toBe(path);
    expect(getTapSettings(path, { c: "grass" })).toBe(path);
  });

  it("takes the path away when the tap is on one", () => {
    const stroke = getTapSettings(path, { c: "grass", p: true });
    expect(stroke).toMatchObject({ tool: "eraser", eraser: "path", size: 0 });
    expect(paintCell({ c: "grass", p: true }, stroke)).toEqual({ c: "grass" });
  });

  it("leaves the other tools alone", () => {
    const brush: PaintSettings = { ...path, tool: "brush" };
    expect(getTapSettings(brush, { p: true })).toBe(brush);
  });
});

describe("paintPath", () => {
  const read = (cells: Record<string, WorldMapCell>) => (cell: Cell) =>
    cells[cellKey(cell)];

  it("links each cell to the next one drawn, and no others", () => {
    // A hex line that bends, so its first and last cells are neighbours.
    const line = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const cells = paintPath("hex_pointy", line, read({}));
    const value = (cell: Cell) => cells[cellKey(cell)];
    expect(
      pathsJoin("hex_pointy", line[0], value(line[0]), line[1], value(line[1])),
    ).toBe(true);
    expect(
      pathsJoin("hex_pointy", line[1], value(line[1]), line[2], value(line[2])),
    ).toBe(true);
    expect(
      pathsJoin("hex_pointy", line[0], value(line[0]), line[2], value(line[2])),
    ).toBe(false);
  });

  it("keeps a cell's links and colour when a new stroke passes through", () => {
    const first = paintPath(
      "square",
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      read({ "1,0": { c: "grass" } }),
    );
    const second = paintPath(
      "square",
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      read(first),
    );
    const middle = second["1,0"];
    expect(middle.c).toBe("grass");
    expect(
      pathsJoin("square", { x: 0, y: 0 }, first["0,0"], { x: 1, y: 0 }, middle),
    ).toBe(true);
    expect(
      pathsJoin(
        "square",
        { x: 1, y: 0 },
        middle,
        { x: 1, y: 1 },
        second["1,1"],
      ),
    ).toBe(true);
  });

  it("joins squares across corners", () => {
    const cells = paintPath(
      "square",
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      read({}),
    );
    expect(
      pathsJoin(
        "square",
        { x: 0, y: 0 },
        cells["0,0"],
        { x: 1, y: 1 },
        cells["1,1"],
      ),
    ).toBe(true);
  });

  it("changes nothing when the path is already there", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    const cells = paintPath("hex_pointy", line, read({}));
    expect(paintPath("hex_pointy", line, read(cells))).toEqual({});
  });

  it("joins old paths to every side-by-side neighbour", () => {
    expect(
      pathsJoin(
        "square",
        { x: 0, y: 0 },
        { p: true },
        { x: 1, y: 0 },
        { p: true },
      ),
    ).toBe(true);
    expect(
      pathsJoin(
        "square",
        { x: 0, y: 0 },
        { p: true },
        { x: 1, y: 1 },
        { p: true },
      ),
    ).toBe(false);
  });
});
