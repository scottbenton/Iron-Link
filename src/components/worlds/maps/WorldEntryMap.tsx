import {
  Alert,
  Button,
  Divider,
  LinearProgress,
  ListItemText,
  MenuItem,
  Stack,
} from "@mui/material";
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
import { PaintSettings } from "lib/worldMap/paint";
import { WORLD_MAP_TERRAINS } from "lib/worldMap/terrain";

import { IWorldEntry } from "services/worldEntries.service";
import { WorldMapsService } from "services/worldMaps.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import type { WorldNavigation } from "../worldNavigation";
import { WorldMapClearDialog } from "./WorldMapClearDialog";
import { WorldMapCreate } from "./WorldMapCreate";
import { WorldMapOptions } from "./WorldMapOptions";
import { WorldMapPinMarker } from "./WorldMapPinMarker";
import { WorldMapToolbar } from "./WorldMapToolbar";
import { WorldMapViewport } from "./WorldMapViewport";
import { useWorldMapBackgroundEditor } from "./useWorldMapBackgroundEditor";
import { useWorldMapBackgroundUpload } from "./useWorldMapBackgroundUpload";
import { useWorldMapPainting } from "./useWorldMapPainting";
import { WorldMapTool, isPaintTool } from "./worldMapTools";

// Names show under pins from this zoom up.
const PIN_LABEL_SCALE = 0.5;

const DEFAULT_PAINT: PaintSettings = {
  tool: "brush",
  terrain: WORLD_MAP_TERRAINS[0].key,
  size: 0,
  eraser: "all",
};

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
  const [chosenTool, setTool] = useState<WorldMapTool>("pan");
  const [paintSettings, setPaintSettings] =
    useState<PaintSettings>(DEFAULT_PAINT);
  const [clearOpen, setClearOpen] = useState(false);
  const backgroundEditor = useWorldMapBackgroundEditor(map, onError);
  const upload = useWorldMapBackgroundUpload(map, onError);
  // A tool that no longer applies (the grid went, the background went) falls
  // back to panning.
  const tool: WorldMapTool =
    !canEdit ||
    (isPaintTool(chosenTool) && grid === "none") ||
    (chosenTool === "background" && !backgroundEditor.background)
      ? "pan"
      : chosenTool;
  const settings = isPaintTool(tool)
    ? { ...paintSettings, tool }
    : paintSettings;
  const painting = useWorldMapPainting(entry.id, grid, settings);
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

  const shownBackground = backgroundEditor.background;
  const background = shownBackground
    ? {
        url:
          WorldMapsService.getBackgroundUrl({
            ...map,
            background: shownBackground,
          }) ?? "",
        x: shownBackground.x,
        y: shownBackground.y,
        width: shownBackground.width,
      }
    : null;
  const painted = chunks.length > 0;

  return (
    <Stack spacing={1}>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      {canEdit && upload.input}
      {canEdit && (
        <WorldMapToolbar
          tool={tool}
          onToolChange={setTool}
          settings={settings}
          onSettingsChange={setPaintSettings}
          canPaint={grid !== "none"}
          background={
            backgroundEditor.width && backgroundEditor.naturalSize
              ? {
                  width: backgroundEditor.width,
                  naturalWidth: backgroundEditor.naturalSize.width,
                  onResize: backgroundEditor.resize,
                }
              : null
          }
          actions={
            grid === "none" &&
            !map.background && (
              <Button
                size="small"
                variant="contained"
                disabled={upload.busy}
                onClick={upload.choose}
              >
                {upload.busy
                  ? t("worlds.maps.background.adding", "Adding image")
                  : t("worlds.maps.background.add", "Add background image")}
              </Button>
            )
          }
        />
      )}
      <WorldMapViewport
        grid={grid}
        chunks={chunks}
        hexFlowers={map.hexFlowers}
        background={background}
        pins={pinGroups}
        ready={!state.loading}
        toolActive={tool !== "pan"}
        toolCursor={tool === "background" ? "move" : "crosshair"}
        onToolPointer={
          tool === "background"
            ? backgroundEditor.onToolPointer
            : painting.onToolPointer
        }
        getHighlight={isPaintTool(tool) ? painting.getHighlight : undefined}
        onBackgroundLoad={backgroundEditor.onBackgroundLoad}
        label={t("worlds.maps.label", "Map of {{name}}", { name: entry.name })}
        overlay={
          canEdit && (
            <WorldMapOptions map={map} painted={painted} onError={onError}>
              {(close) => [
                <Divider key="divider" />,
                <MenuItem
                  key="background"
                  disabled={upload.busy}
                  onClick={() => {
                    close();
                    upload.choose();
                  }}
                >
                  <ListItemText
                    primary={
                      map.background
                        ? t(
                            "worlds.maps.background.replace",
                            "Replace background image",
                          )
                        : t(
                            "worlds.maps.background.add",
                            "Add background image",
                          )
                    }
                  />
                </MenuItem>,
                map.background && (
                  <MenuItem
                    key="remove-background"
                    disabled={upload.busy}
                    onClick={() => {
                      close();
                      upload.remove();
                    }}
                  >
                    <ListItemText
                      primary={t(
                        "worlds.maps.background.remove",
                        "Remove background image",
                      )}
                    />
                  </MenuItem>
                ),
                grid !== "none" && (
                  <MenuItem
                    key="clear"
                    disabled={!painted}
                    onClick={() => {
                      close();
                      setClearOpen(true);
                    }}
                  >
                    <ListItemText
                      primary={t("worlds.maps.clear.confirm", "Clear map")}
                      secondary={t(
                        "worlds.maps.clear.help",
                        "Pins stay where they are",
                      )}
                    />
                  </MenuItem>
                ),
              ]}
            </WorldMapOptions>
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
      {canEdit && (
        <WorldMapClearDialog
          entryId={entry.id}
          open={clearOpen}
          onClose={() => setClearOpen(false)}
          onError={onError}
        />
      )}
    </Stack>
  );
}
