import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import {
  Autocomplete,
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import { WorldCategoryIcon } from "../categories/WorldCategoryIcon";
import { WorldMapPinIcon } from "./WorldMapPinIcon";
import { WorldMapPlaceOption, WorldMapPlaceWhere } from "./useWorldMapPins";
import { WorldMapPinTarget } from "./worldMapTools";

const ORDER: Record<WorldMapPlaceWhere, number> = {
  inside: 0,
  pinned: 1,
  elsewhere: 2,
};

// The pin tool's popup: a new place of a Location Type, or an existing place
// (from this entry, or from elsewhere in the world, which pinning moves in
// here). Choosing one closes it; the next tap on the map puts it down.
export function WorldMapPinMenu({
  mapName,
  places,
  target,
  onTargetChange,
  locationTypes,
  onClose,
  touch = false,
}: {
  mapName: string;
  places: WorldMapPlaceOption[];
  target: WorldMapPinTarget;
  onTargetChange: (target: WorldMapPinTarget) => void;
  locationTypes: string[];
  onClose: () => void;
  touch?: boolean;
}) {
  const { t } = useTranslation();
  const selected =
    target.type === "entry"
      ? (places.find((place) => place.entry.id === target.entryId) ?? null)
      : null;
  const sorted = [...places].sort(
    (a, b) =>
      ORDER[a.where] - ORDER[b.where] ||
      a.entry.name.localeCompare(b.entry.name),
  );
  const newTypes: (string | null)[] = [...locationTypes, null];
  const groupLabels: Record<WorldMapPlaceWhere, string> = {
    inside: t("worlds.maps.pins.not-on-map-in", "In {{name}}, not on the map", {
      name: mapName,
    }),
    pinned: t("worlds.maps.pins.on-map", "On the map"),
    elsewhere: t(
      "worlds.maps.pins.elsewhere",
      "Elsewhere (moves into {{name}})",
      { name: mapName },
    ),
  };

  return (
    <Box sx={{ width: touch ? "min(360px, 100%)" : 320 }}>
      <Autocomplete
        size={touch ? "medium" : "small"}
        options={sorted}
        value={selected}
        openOnFocus
        groupBy={(option) => groupLabels[option.where]}
        getOptionLabel={(option) => option.entry.name}
        isOptionEqualToValue={(a, b) => a.entry.id === b.entry.id}
        onChange={(_, option) => {
          if (!option) return;
          onTargetChange({ type: "entry", entryId: option.entry.id });
          onClose();
        }}
        renderOption={({ key, ...props }, option) => (
          <Box
            component="li"
            key={key}
            {...props}
            sx={{ display: "flex", gap: 1 }}
          >
            <WorldMapPinIcon entry={option.entry} />
            <ListItemText
              primary={option.entry.name}
              secondary={
                option.where === "elsewhere"
                  ? (option.parentName ??
                    t("worlds.maps.pins.top-level", "Not inside anything"))
                  : undefined
              }
              sx={{ my: 0 }}
            />
          </Box>
        )}
        noOptionsText={t("worlds.maps.pins.no-places", "No places to pin yet")}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("worlds.maps.pins.existing", "Existing place")}
          />
        )}
      />
      <Typography
        variant="overline"
        color="text.secondary"
        component="p"
        id="world-map-new-place"
        sx={{ mt: 1.5 }}
      >
        {t("worlds.maps.pins.new", "New place")}
      </Typography>
      <MenuList
        dense={!touch}
        aria-labelledby="world-map-new-place"
        disablePadding
        sx={{ mx: -2 }}
      >
        {newTypes.map((type) => {
          const checked = target.type === "new" && target.locationType === type;
          const icon = getLocationTypeIcon(type ?? undefined);
          return (
            <MenuItem
              key={type ?? ""}
              role="menuitemradio"
              aria-checked={checked}
              selected={checked}
              sx={{ minHeight: touch ? 44 : undefined, px: 2 }}
              onClick={() => {
                onTargetChange({ type: "new", locationType: type });
                onClose();
              }}
            >
              <ListItemIcon>
                {icon ? (
                  <WorldCategoryIcon icon={icon} size="small" />
                ) : (
                  <AddLocationAltIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={type ?? t("worlds.maps.pins.other", "Other place")}
              />
            </MenuItem>
          );
        })}
      </MenuList>
    </Box>
  );
}
