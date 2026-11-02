import { Alert, LinearProgress, Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  getDisplayedChunks,
  useListenToWorldMap,
  useWorldMapState,
} from "stores/worldMaps.store";

import { snapToGrid } from "lib/worldMap/content";
import { Point } from "lib/worldMap/grid";

import { IWorldEntry } from "services/worldEntries.service";
import { WorldMapsService } from "services/worldMaps.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import type { WorldNavigation } from "../worldNavigation";
import { WorldMapCreate } from "./WorldMapCreate";
import { WorldMapOptions } from "./WorldMapOptions";
import { WorldMapPinMarker } from "./WorldMapPinMarker";
import { WorldMapViewport } from "./WorldMapViewport";

// Names show under pins from this zoom up.
const PIN_LABEL_SCALE = 0.5;

// An entry's map: its painted cells, its background, and the entries inside
// it pinned where they are. Readers see only pins for entries they can read.
export function WorldEntryMap({
  entry,
  canEdit,
  navigation,
}: {
  entry: IWorldEntry;
  canEdit: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
}) {
  const { t } = useTranslation();
  useListenToWorldMap(entry.id);
  const state = useWorldMapState(entry.id);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const [error, setError] = useState<string>();
  const onError = (cause: unknown) => setError(getEditorErrorMessage(cause));

  const map = state.map;
  const grid = map?.grid ?? "none";
  const chunks = useMemo(
    () => getDisplayedChunks(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.chunks, state.pending],
  );
  // Pins sharing a spot are drawn as one marker.
  const pinGroups = useMemo(() => {
    const groups = new Map<string, { point: Point; entries: IWorldEntry[] }>();
    Object.values(state.pins).forEach((pin) => {
      const pinned = entries[pin.entryId];
      if (!pinned || pinned.parentEntryId !== entry.id) return;
      const point = snapToGrid(grid, pin);
      const key = `${point.x},${point.y}`;
      const group = groups.get(key) ?? { point, entries: [] };
      group.entries.push(pinned);
      groups.set(key, group);
    });
    return [...groups.values()].map((group) => ({
      point: group.point,
      pin: {
        entries: group.entries.sort((a, b) => a.name.localeCompare(b.name)),
      },
    }));
  }, [state.pins, entries, entry.id, grid]);

  if (state.loading)
    return (
      <LinearProgress aria-label={t("worlds.maps.loading", "Loading map")} />
    );
  if (state.error && !map)
    return (
      <Alert severity="error">
        {t(
          "worlds.maps.load-error",
          "Could not load this map. Please reopen it to try again.",
        )}
      </Alert>
    );
  if (!map)
    return <WorldMapCreate entry={entry} canEdit={canEdit} onError={onError} />;

  const background = map.background
    ? {
        url: WorldMapsService.getBackgroundUrl(map) ?? "",
        x: map.background.x,
        y: map.background.y,
        width: map.background.width,
      }
    : null;

  return (
    <Stack spacing={1}>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      <WorldMapViewport
        grid={grid}
        chunks={chunks}
        hexFlowers={map.hexFlowers}
        background={background}
        pins={pinGroups}
        ready={!state.loading}
        label={t("worlds.maps.label", "Map of {{name}}", { name: entry.name })}
        overlay={
          canEdit && (
            <WorldMapOptions
              map={map}
              painted={chunks.length > 0}
              onError={onError}
            />
          )
        }
        renderPin={({ pin, screen, point, scale }) => (
          <WorldMapPinMarker
            key={`${point.x},${point.y}`}
            entries={pin.entries}
            screen={screen}
            showLabel={scale >= PIN_LABEL_SCALE}
            navigation={navigation}
          />
        )}
      />
    </Stack>
  );
}
