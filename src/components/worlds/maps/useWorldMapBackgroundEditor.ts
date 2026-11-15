import { useCallback, useRef, useState } from "react";

import { useWorldMapsStore } from "stores/worldMaps.store";

import { Point } from "lib/worldMap/grid";

import { IWorldMap, IWorldMapBackground } from "services/worldMaps.service";

import { WorldMapPointerEvent } from "./WorldMapViewport";

export interface WorldMapBackgroundSize {
  width: number;
  height: number;
}

// Moving and resizing a map's background image. Changes show at once as a
// draft and save when the drag or the size slider is let go; the draft stays
// until the save is done, so the image never jumps back.
export function useWorldMapBackgroundEditor(
  map: IWorldMap | null,
  onError: (cause: unknown) => void,
) {
  const updateMap = useWorldMapsStore((store) => store.updateMap);
  const [draft, setDraft] = useState<IWorldMapBackground>();
  const [naturalSize, setNaturalSize] = useState<WorldMapBackgroundSize>();
  const drag = useRef<{ start: Point; origin: Point }>(undefined);
  const background = draft ?? map?.background ?? null;
  const backgroundRef = useRef(background);
  backgroundRef.current = background;

  const save = useCallback(
    (next: IWorldMapBackground) => {
      if (!map) return;
      setDraft(next);
      updateMap(map.entryId, { background: next })
        .catch(onError)
        .finally(() =>
          setDraft((current) => (current === next ? undefined : current)),
        );
    },
    [map, updateMap, onError],
  );

  const onToolPointer = useCallback(
    (event: WorldMapPointerEvent) => {
      const current = backgroundRef.current;
      if (!current) return;
      if (event.phase === "start") {
        drag.current = {
          start: event.point,
          origin: { x: current.x, y: current.y },
        };
        return;
      }
      const held = drag.current;
      if (!held) return;
      const moved = {
        ...current,
        x: Math.round(held.origin.x + event.point.x - held.start.x),
        y: Math.round(held.origin.y + event.point.y - held.start.y),
      };
      if (event.phase === "move") {
        setDraft(moved);
        return;
      }
      drag.current = undefined;
      if (event.phase === "cancel") setDraft(undefined);
      else save(moved);
    },
    [save],
  );

  // Width in map units, the image's own width until someone resizes it.
  const width = background
    ? (background.width ?? naturalSize?.width ?? null)
    : null;

  // Resizes around the image's centre.
  const resize = useCallback(
    (nextWidth: number, commit: boolean) => {
      const current = backgroundRef.current;
      const oldWidth = current?.width ?? naturalSize?.width;
      if (!current || !oldWidth || !naturalSize) return;
      const ratio = naturalSize.height / naturalSize.width;
      const roundedWidth = Math.round(nextWidth);
      const next = {
        ...current,
        x: Math.round(current.x + (oldWidth - roundedWidth) / 2),
        y: Math.round(current.y + ((oldWidth - roundedWidth) * ratio) / 2),
        width: roundedWidth,
      };
      if (commit) save(next);
      else setDraft(next);
    },
    [naturalSize, save],
  );

  return {
    background,
    width,
    naturalSize,
    onBackgroundLoad: setNaturalSize,
    onToolPointer,
    resize,
  };
}
