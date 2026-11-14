import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldCategoryIcon } from "../categories/WorldCategoryIcon";
import { WorldMapPinIcon } from "./WorldMapPinIcon";
import { WorldMapPlaceOption } from "./useWorldMapPins";
import { WorldMapPinTarget } from "./worldMapTools";

// Over the map, top left, while the pin tool is in hand: what a tap puts
// down, and a way to take it off the map when it is already there.
export function WorldMapPinStatus({
  mapName,
  places,
  target,
  onRemove,
  busy,
  touch = false,
}: {
  mapName: string;
  places: WorldMapPlaceOption[];
  target: WorldMapPinTarget;
  onRemove: (entry: IWorldEntry) => void;
  busy: boolean;
  touch?: boolean;
}) {
  const { t } = useTranslation();
  const place =
    target.type === "entry"
      ? places.find((option) => option.entry.id === target.entryId)
      : undefined;
  const typeIcon =
    target.type === "new"
      ? getLocationTypeIcon(target.locationType ?? undefined)
      : undefined;
  const name =
    target.type === "new"
      ? t("worlds.maps.pins.new-of-type", "A new {{type}}", {
          type:
            target.locationType ?? t("worlds.maps.pins.place-lower", "place"),
        })
      : (place?.entry.name ?? "");
  const hint =
    target.type === "new"
      ? t("worlds.maps.pins.hint-new", "Pick a spot on the map to add it")
      : place?.where === "pinned"
        ? t(
            "worlds.maps.pins.hint-move",
            "Pick a new spot or drag its pin to move it",
          )
        : place?.where === "elsewhere"
          ? t(
              "worlds.maps.pins.hint-elsewhere",
              "Pick a spot to move it into {{name}} and pin it",
              { name: mapName },
            )
          : t(
              "worlds.maps.pins.hint-place",
              "Pick a spot on the map to pin it",
            );

  return (
    <Paper
      role="status"
      elevation={2}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        pl: 1.5,
        pr: place?.where === "pinned" ? 0.5 : 1.5,
        py: 0.5,
        minHeight: touch ? 44 : 36,
        maxWidth: "100%",
      }}
    >
      <Box sx={{ display: "flex", flexShrink: 0 }}>
        {place ? (
          <WorldMapPinIcon entry={place.entry} />
        ) : typeIcon ? (
          <WorldCategoryIcon icon={typeIcon} size="small" />
        ) : (
          <AddLocationAltIcon fontSize="small" />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap fontWeight="medium">
          {name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          component="p"
        >
          {hint}
        </Typography>
      </Box>
      {place?.where === "pinned" && (
        <Button
          size="small"
          color="error"
          disabled={busy}
          onClick={() => onRemove(place.entry)}
          sx={{ flexShrink: 0, minHeight: touch ? 44 : undefined }}
        >
          {t("worlds.maps.pins.remove", "Remove from map")}
        </Button>
      )}
    </Paper>
  );
}
