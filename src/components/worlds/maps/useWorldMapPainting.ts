import { useCallback, useRef } from "react";

import { readWorldMapCell, useWorldMapsStore } from "stores/worldMaps.store";

import { Cell, PaintableGrid } from "lib/worldMap/grid";
import {
  PaintSettings,
  getBrushCells,
  getStrokeCells,
  paintCells,
} from "lib/worldMap/paint";

import { WorldMapPointerEvent } from "./WorldMapViewport";

// Turns pointer strokes into painted cells. Each move paints the line from
// the last cell, so a fast stroke leaves no gaps; the store shows the cells at
// once and saves them after a short pause.
export function useWorldMapPainting(
  entryId: string,
  grid: PaintableGrid | "none",
  settings: PaintSettings,
) {
  const paint = useWorldMapsStore((store) => store.paint);
  const last = useRef<Cell | undefined>(undefined);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const onToolPointer = useCallback(
    (event: WorldMapPointerEvent) => {
      if (grid === "none" || !event.cell) return;
      if (event.phase === "end" || event.phase === "cancel") {
        last.current = undefined;
        return;
      }
      const current = settingsRef.current;
      const cells = getStrokeCells(
        grid,
        event.phase === "start" ? undefined : last.current,
        event.cell,
        current,
      );
      last.current = event.cell;
      const state = useWorldMapsStore.getState().maps[entryId];
      if (!state) return;
      const changes = paintCells(
        cells,
        (cell) => readWorldMapCell(state, cell),
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
