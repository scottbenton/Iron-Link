import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Dialog,
  Divider,
  LinearProgress,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
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

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";
import { WorldMapsService } from "services/worldMaps.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import type { WorldNavigation } from "../worldNavigation";
import { WorldMapClearDialog } from "./WorldMapClearDialog";
import { WorldMapCreate } from "./WorldMapCreate";
import { WorldMapOptions } from "./WorldMapOptions";
import { WorldMapPinMarker } from "./WorldMapPinMarker";
import { WorldMapPinTools } from "./WorldMapPinTools";
import { WorldMapToolbar } from "./WorldMapToolbar";
import { WorldMapViewport } from "./WorldMapViewport";
import { useWorldMapBackgroundEditor } from "./useWorldMapBackgroundEditor";
import { useWorldMapBackgroundUpload } from "./useWorldMapBackgroundUpload";
import { useWorldMapPainting } from "./useWorldMapPainting";
import { useWorldMapPins } from "./useWorldMapPins";
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
  category,
  canEdit,
  navigation,
}: {
  entry: IWorldEntry;
  category: Pick<IWorldCategory, "supportsHierarchy">;
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
  // Phones edit in a full-screen paint mode; outside it the map only pans.
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const [paintModeOpen, setPaintModeOpen] = useState(false);
  const paintMode = phone && paintModeOpen && canEdit;
  const backgroundEditor = useWorldMapBackgroundEditor(map, onError);
  const upload = useWorldMapBackgroundUpload(map, onError);
  // A tool that no longer applies (the grid went, the background went) falls
  // back to panning.
  const canPin = category.supportsHierarchy;
  const tool: WorldMapTool =
    !canEdit ||
    (phone && !paintMode) ||
    (isPaintTool(chosenTool) && grid === "none") ||
    (chosenTool === "pin" && !canPin) ||
    (chosenTool === "background" && !backgroundEditor.background)
      ? "pan"
      : chosenTool;
  const settings = isPaintTool(tool)
    ? { ...paintSettings, tool }
    : paintSettings;
  const painting = useWorldMapPainting(entry.id, grid, settings);
  const pinTool = useWorldMapPins(entry, grid, state.pins, onError);
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
      // A lone pin is its entry, so it can be dragged by id.
      id:
        group.entries.length === 1
          ? group.entries[0].id
          : `${group.point.x},${group.point.y}`,
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

  const renderToolbar = (touch: boolean) => (
    <WorldMapToolbar
      touch={touch}
      tool={tool}
      onToolChange={setTool}
      settings={settings}
      onSettingsChange={setPaintSettings}
      canPaint={grid !== "none"}
      canPin={canPin}
      pinTools={
        <WorldMapPinTools
          touch={touch}
          places={pinTool.places}
          target={pinTool.target}
          onTargetChange={pinTool.setTarget}
          locationTypes={pinTool.locationTypes}
          onRemove={pinTool.remove}
          busy={pinTool.busy}
        />
      }
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
            sx={{ minHeight: touch ? 44 : undefined, flexShrink: 0 }}
          >
            {upload.busy
              ? t("worlds.maps.background.adding", "Adding image")
              : t("worlds.maps.background.add", "Add background image")}
          </Button>
        )
      }
    />
  );

  const renderViewport = (touch: boolean, height?: string) => (
    <WorldMapViewport
      grid={grid}
      chunks={chunks}
      hexFlowers={map.hexFlowers}
      background={background}
      pins={pinGroups}
      ready={!state.loading}
      touch={touch}
      height={height}
      toolActive={tool !== "pan"}
      toolMode={tool === "pin" ? "tap" : "stroke"}
      toolCursor={tool === "background" ? "move" : "crosshair"}
      onToolPointer={
        tool === "background"
          ? backgroundEditor.onToolPointer
          : tool === "pin"
            ? pinTool.onToolPointer
            : painting.onToolPointer
      }
      getHighlight={
        isPaintTool(tool)
          ? painting.getHighlight
          : tool === "pin"
            ? (cell) => [cell]
            : undefined
      }
      onPinDrop={
        tool === "pin"
          ? (id, point) =>
              // A marker's id is its entry, or its spot when it holds
              // several, which then all move together.
              (
                pinGroups
                  .find((group) => group.id === id)
                  ?.pin.entries.map((pinned) => pinned.id) ?? [id]
              ).forEach((entryId) => pinTool.onPinDrop(entryId, point))
          : undefined
      }
      onBackgroundLoad={backgroundEditor.onBackgroundLoad}
      label={t("worlds.maps.label", "Map of {{name}}", { name: entry.name })}
      overlay={
        <>
          {canEdit && (!phone || paintMode) && (
            <WorldMapOptions
              map={map}
              painted={painted}
              onError={onError}
              touch={touch}
            >
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
          )}
        </>
      }
      renderPin={({ id, pin, screen, scale, dragging, startDrag }) => (
        <WorldMapPinMarker
          key={id}
          entries={pin.entries}
          screen={screen}
          showLabel={scale >= PIN_LABEL_SCALE}
          navigation={navigation}
          onSelect={tool === "pin" ? pinTool.select : undefined}
          onDragStart={tool === "pin" ? startDrag : undefined}
          dragging={dragging}
          selected={pin.entries.some(
            (pinned) => pinned.id === pinTool.selectedId,
          )}
        />
      )}
    />
  );

  const errorAlert = error && (
    <Alert severity="error" onClose={() => setError(undefined)}>
      {error}
    </Alert>
  );

  return (
    <Stack spacing={1}>
      {!paintMode && errorAlert}
      {canEdit && upload.input}
      {canEdit && phone && (
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setPaintModeOpen(true)}
          sx={{ minHeight: 44, alignSelf: "flex-start" }}
        >
          {t("worlds.maps.paint-mode", "Edit map")}
        </Button>
      )}
      {canEdit && !phone && renderToolbar(false)}
      {!paintMode && renderViewport(phone)}
      {paintMode && (
        <Dialog
          fullScreen
          open
          onClose={() => setPaintModeOpen(false)}
          aria-labelledby="world-map-paint-mode-title"
        >
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                pt: "env(safe-area-inset-top)",
                minHeight: 52,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                id="world-map-paint-mode-title"
                variant="h6"
                component="h2"
                noWrap
                sx={{ flex: 1, minWidth: 0, pl: 1 }}
              >
                {t("worlds.maps.paint-mode-title", "Editing {{name}}", {
                  name: entry.name,
                })}
              </Typography>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() => setPaintModeOpen(false)}
                sx={{ minHeight: 44 }}
              >
                {t("common.done", "Done")}
              </Button>
            </Box>
            {errorAlert}
            <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {renderViewport(true, "100%")}
              </Box>
            </Box>
            {renderToolbar(true)}
          </Box>
        </Dialog>
      )}
      {pinTool.dialog}
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
