import { Box, LinearProgress } from "@mui/material";
import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  getDisplayedChunks,
  useListenToWorldMap,
  useWorldMapState,
} from "stores/worldMaps.store";

import { snapToGrid } from "lib/worldMap/content";
import { Point } from "lib/worldMap/grid";

import { ReadPermissions } from "repositories/shared.types";

import { IWorldEntry } from "services/worldEntries.service";
import { WorldMapsService } from "services/worldMaps.service";

import { WorldMapPinMarker } from "./WorldMapPinMarker";
import { WorldMapViewport } from "./WorldMapViewport";

// An entry's map for the whole table, on the second screen: the painted
// cells, the background and the pins of places everyone can read. The
// second screen signs in as the Guide, so Guide prep places are left out
// here rather than by the database. Nobody steers it, so it fits everything
// again as the Guide paints and pins.
export function WorldMapScreen({
  entry,
  fallback,
}: {
  entry: IWorldEntry;
  // Shown while the entry has no map.
  fallback: ReactNode;
}) {
  const { t } = useTranslation();
  useListenToWorldMap(entry.id);
  const state = useWorldMapState(entry.id);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const map = state.map;
  const grid = map?.grid ?? "none";
  const chunks = useMemo(
    () => getDisplayedChunks(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.chunks, state.pending],
  );
  const pins = useMemo(() => {
    const groups = new Map<string, { point: Point; entries: IWorldEntry[] }>();
    Object.values(state.pins).forEach((pin) => {
      const pinned = entries[pin.entryId];
      if (
        !pinned ||
        pinned.parentEntryId !== entry.id ||
        pinned.readPermissions === ReadPermissions.OnlyGuides
      )
        return;
      const point = snapToGrid(grid, pin);
      const key = `${point.x},${point.y}`;
      const group = groups.get(key) ?? { point, entries: [] };
      group.entries.push(pinned);
      groups.set(key, group);
    });
    return [...groups.entries()].map(([key, group]) => ({
      id: key,
      point: group.point,
      pin: group.entries.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [state.pins, entries, entry.id, grid]);

  if (state.loading) return <LinearProgress sx={{ flexGrow: 1 }} />;
  if (!map) return fallback;

  const background = map.background
    ? {
        url: WorldMapsService.getBackgroundUrl(map) ?? "",
        x: map.background.x,
        y: map.background.y,
        width: map.background.width,
      }
    : null;

  return (
    <Box sx={{ flexGrow: 1, display: "flex", p: 1 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <WorldMapViewport
          grid={grid}
          chunks={chunks}
          hexFlowers={map.hexFlowers}
          background={background}
          pins={pins}
          ready={!state.loading}
          autoFit
          controls={false}
          height="100%"
          label={t("worlds.maps.label", "Map of {{name}}", {
            name: entry.name,
          })}
          renderPin={({ id, pin, screen }) => (
            <WorldMapPinMarker
              key={id}
              entries={pin}
              screen={screen}
              showLabel
            />
          )}
        />
      </Box>
    </Box>
  );
}
