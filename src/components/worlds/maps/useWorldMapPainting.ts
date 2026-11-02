import { useCallback, useRef } from "react";

import { readWorldMapCell, useWorldMapsStore } from "stores/worldMaps.store";

import { Cell, PaintableGrid, cellKey, cellLine } from "lib/worldMap/grid";
import {
  PaintSettings,
  getBrushCells,
  getStrokeCells,
  getTapSettings,
  paintCells,
  paintPath,
} from "lib/worldMap/paint";

import { WorldMapPointerEvent } from "./WorldMapViewport";

// Turns pointer strokes into painted cells. Each move paints the line from
// the last cell, so a fast stroke leaves no gaps; the store shows the cells at
// once and saves them after a short pause. Clicking a path with the path tool
// (a stroke that never leaves the cell it started on) takes it away, while a
// stroke that starts on a path and moves on extends it.
export function useWorldMapPainting(
  entryId: string,
  grid: PaintableGrid | "none",
  settings: PaintSettings,
) {
  const paint = useWorldMapsStore((store) => store.paint);
  const last = useRef<Cell | undefined>(undefined);
  // A stroke that started on a path, until it leaves that cell.
  const pathTap = useRef<{ cell: Cell; settings: PaintSettings } | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const onToolPointer = useCallback(
    (event: WorldMapPointerEvent) => {
      if (grid === "none" || !event.cell) return;
      const state = useWorldMapsStore.getState().maps[entryId];
      if (event.phase === "end" || event.phase === "cancel") {
        const tap = pathTap.current;
        pathTap.current = null;
        last.current = undefined;
        if (tap && state && event.phase === "end") {
          const changes = paintCells(
            [tap.cell],
            (cell) => readWorldMapCell(state, cell),
            tap.settings,
          );
          if (Object.keys(changes).length > 0) paint(entryId, changes);
        }
        return;
      }
      if (!state) return;
      const current = settingsRef.current;
      if (event.phase === "start") {
        const tap = getTapSettings(
          current,
          readWorldMapCell(state, event.cell),
        );
        pathTap.current =
          tap === current ? null : { cell: event.cell, settings: tap };
      } else if (
        pathTap.current &&
        cellKey(pathTap.current.cell) !== cellKey(event.cell)
      ) {
        pathTap.current = null;
      }
      const from = event.phase === "start" ? undefined : last.current;
      last.current = event.cell;
      const read = (cell: Cell) => readWorldMapCell(state, cell);
      // Paths link each cell to the next one drawn.
      const changes =
        current.tool === "path"
          ? paintPath(
              grid,
              from ? cellLine(grid, from, event.cell) : [event.cell],
              read,
            )
          : paintCells(
              getStrokeCells(grid, from, event.cell, current),
              read,
              current,
            );
      if (Object.keys(changes).length > 0) paint(entryId, changes);
    },
    [entryId, grid, paint],
  );

  const getHighlight = useCallback(
    (cell: Cell) =>
      grid === "none"
        ? []
        : getBrushCells(
            grid,
            cell,
            settingsRef.current.tool === "path" ? 0 : settingsRef.current.size,
          ),
    [grid],
  );

  return { onToolPointer, getHighlight };
}
