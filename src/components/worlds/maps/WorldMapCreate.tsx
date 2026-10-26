import MapIcon from "@mui/icons-material/Map";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldMapsStore } from "stores/worldMaps.store";

import { WorldMapGrid } from "lib/worldMap/grid";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldMapGridPicker } from "./WorldMapGridPicker";

// An entry without a map yet. Editors pick its grid and make it; the grid
// can only change later while nothing is painted.
export function WorldMapCreate({
  entry,
  canEdit,
  onError,
}: {
  entry: Pick<IWorldEntry, "id" | "worldId" | "name">;
  canEdit: boolean;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const createMap = useWorldMapsStore((store) => store.createMap);
  const [grid, setGrid] = useState<WorldMapGrid>("hex_pointy");
  const [busy, setBusy] = useState(false);
  if (!canEdit)
    return (
      <EmptyState
        message={t("worlds.maps.none", "{{name}} has no map yet.", {
          name: entry.name,
        })}
        sx={{ py: 4 }}
      />
    );
  return (
    <Box
      component="section"
      aria-label={t("worlds.maps.create-title", "Make a map")}
      sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 3 }}
    >
      <Stack spacing={2} alignItems="flex-start">
        <Box>
          <Typography variant="h6" component="h2">
            {t("worlds.maps.create-title", "Make a map")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "worlds.maps.create-help",
              "Maps go on forever in every direction. Choose a grid; it can only change while nothing is painted.",
            )}
          </Typography>
        </Box>
        <WorldMapGridPicker value={grid} onChange={setGrid} disabled={busy} />
        <Button
          variant="contained"
          startIcon={<MapIcon />}
          disabled={busy}
          onClick={() => {
            setBusy(true);
            createMap(entry.worldId, entry.id, grid)
              .catch(onError)
              .finally(() => setBusy(false));
          }}
        >
          {busy
            ? t("worlds.maps.creating", "Making map")
            : t("worlds.maps.create", "Make map")}
        </Button>
      </Stack>
    </Box>
  );
}
