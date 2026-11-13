import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldCategoryIcon } from "../categories/WorldCategoryIcon";
import { WorldMapPinIcon } from "./WorldMapPinIcon";
import { WorldMapPinTarget } from "./worldMapTools";

interface PlaceOption {
  entry: IWorldEntry;
  pinned: boolean;
}

// The pin tool's settings: which place a tap on the map puts down. Places
// inside this entry can be picked (those not on the map first), or a new
// place of a Location Type made where the map is tapped.
export function WorldMapPinTools({
  places,
  target,
  onTargetChange,
  locationTypes,
  onRemove,
  busy,
}: {
  places: PlaceOption[];
  target: WorldMapPinTarget;
  onTargetChange: (target: WorldMapPinTarget) => void;
  locationTypes: string[];
  onRemove: (entry: IWorldEntry) => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const selected =
    target.type === "entry"
      ? (places.find((place) => place.entry.id === target.entryId) ?? null)
      : null;
  const sorted = [...places].sort(
    (a, b) =>
      Number(a.pinned) - Number(b.pinned) ||
      a.entry.name.localeCompare(b.entry.name),
  );
  const newTypes: (string | null)[] = [...locationTypes, null];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        flex: "1 1 320px",
      }}
    >
      <Autocomplete
        size="small"
        options={sorted}
        value={selected}
        groupBy={(option) =>
          option.pinned
            ? t("worlds.maps.pins.on-map", "On the map")
            : t("worlds.maps.pins.not-on-map", "Not on the map")
        }
        getOptionLabel={(option) => option.entry.name}
        isOptionEqualToValue={(a, b) => a.entry.id === b.entry.id}
        onChange={(_, option) =>
          onTargetChange(
            option
              ? { type: "entry", entryId: option.entry.id }
              : { type: "new", locationType: null },
          )
        }
        renderOption={({ key, ...props }, option) => (
          <Box
            component="li"
            key={key}
            {...props}
            sx={{ display: "flex", gap: 1 }}
          >
            <WorldMapPinIcon entry={option.entry} />
            {option.entry.name}
          </Box>
        )}
        noOptionsText={t(
          "worlds.maps.pins.no-places",
          "Nothing is inside this entry yet",
        )}
        sx={{ width: 240 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("worlds.maps.pins.place", "Place to pin")}
          />
        )}
      />
      {selected?.pinned && (
        <Button
          size="small"
          color="error"
          disabled={busy}
          onClick={() => onRemove(selected.entry)}
        >
          {t("worlds.maps.pins.remove", "Remove from map")}
        </Button>
      )}
      <Box
        role="radiogroup"
        aria-label={t("worlds.maps.pins.new", "New place")}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
          {t("worlds.maps.pins.new", "New place")}
        </Typography>
        {newTypes.map((type) => {
          const checked = target.type === "new" && target.locationType === type;
          const icon = getLocationTypeIcon(type ?? undefined);
          return (
            <Chip
              key={type ?? ""}
              role="radio"
              aria-checked={checked}
              size="small"
              color={checked ? "primary" : "default"}
              variant={checked ? "filled" : "outlined"}
              icon={
                icon ? (
                  <Box
                    component="span"
                    sx={{ display: "flex", ml: 0.5, "& > *": { m: 0 } }}
                  >
                    <WorldCategoryIcon icon={icon} size="small" />
                  </Box>
                ) : (
                  <AddLocationAltIcon />
                )
              }
              label={type ?? t("worlds.maps.pins.other", "Other place")}
              onClick={() =>
                onTargetChange({ type: "new", locationType: type })
              }
            />
          );
        })}
      </Box>
    </Box>
  );
}
