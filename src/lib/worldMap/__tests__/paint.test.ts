// @vitest-environment node
import { describe, expect, it } from "vitest";

import { cellKey } from "../grid";
import { getStrokeCells, paintCell, paintCells } from "../paint";

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
    expect(paintCell({ c: "grass" }, path)).toEqual({ c: "grass", p: true });
    expect(paintCell({ p: true }, path)).toBeUndefined();
  });

  it("erases everything, or only paths", () => {
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
