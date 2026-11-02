import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  MenuList,
  TextField,
  Typography,
} from "@mui/material";
import { KeyboardEvent, ReactNode, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import { WorldCategoryIcon } from "../categories/WorldCategoryIcon";
import { WorldMapPinIcon } from "./WorldMapPinIcon";
import { WorldMapPlaceOption, WorldMapPlaceWhere } from "./useWorldMapPins";
import { WorldMapPinTarget } from "./worldMapTools";

const GROUPS: WorldMapPlaceWhere[] = ["inside", "pinned", "elsewhere"];

function matches(text: string, query: string): boolean {
  return text.toLocaleLowerCase().includes(query);
}

// The pin tool's popup, one searchable list on one surface: a new place of a
// Location Type, then existing places (in this entry and not on the map yet,
// already on the map, and elsewhere in the world, which pinning moves in
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
  const id = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();

  const otherLabel = t("worlds.maps.pins.other", "Other place");
  const newTypes = [...locationTypes, null].filter(
    (type) => !query || matches(type ?? otherLabel, query),
  );
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
  const groups = GROUPS.map((where) => ({
    where,
    places: places
      .filter(
        (place) =>
          place.where === where && (!query || matches(place.entry.name, query)),
      )
      .sort((a, b) => a.entry.name.localeCompare(b.entry.name)),
  })).filter((group) => group.places.length > 0);

  const choose = (next: WorldMapPinTarget) => {
    onTargetChange(next);
    onClose();
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      listRef.current
        ?.querySelector<HTMLElement>('[role^="menuitem"]')
        ?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      listRef.current
        ?.querySelector<HTMLElement>('[role^="menuitem"]')
        ?.click();
    }
  };
  const subheader = (label: string): ReactNode => (
    <ListSubheader
      key={label}
      disableSticky
      sx={{
        lineHeight: touch ? "36px" : "32px",
        bgcolor: "transparent",
        typography: "overline",
        color: "text.secondary",
      }}
    >
      {label}
    </ListSubheader>
  );
  const itemSx = { minHeight: touch ? 44 : undefined, px: 2 };

  return (
    <Box sx={{ width: touch ? "min(360px, 100%)" : 320, mx: -2, my: -1 }}>
      <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
        <TextField
          fullWidth
          size={touch ? "medium" : "small"}
          // A phone's keyboard would cover the list, so only pointers with
          // a keyboard start in the field.
          autoFocus={!touch}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder={t("worlds.maps.pins.search", "Search places")}
          slotProps={{
            htmlInput: {
              "aria-label": t("worlds.maps.pins.search", "Search places"),
              "aria-controls": id,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <MenuList
        id={id}
        ref={listRef}
        dense={!touch}
        aria-label={t("worlds.maps.pins.choose", "What to add to the map")}
        sx={{ maxHeight: touch ? "50vh" : 360, overflowY: "auto", pt: 0 }}
      >
        {newTypes.length > 0 &&
          subheader(t("worlds.maps.pins.new", "New place"))}
        {newTypes.map((type) => {
          const checked = target.type === "new" && target.locationType === type;
          const icon = getLocationTypeIcon(type ?? undefined);
          return (
            <MenuItem
              key={`new-${type ?? ""}`}
              role="menuitemradio"
              aria-checked={checked}
              selected={checked}
              sx={itemSx}
              onClick={() => choose({ type: "new", locationType: type })}
            >
              <ListItemIcon>
                {icon ? (
                  <WorldCategoryIcon icon={icon} size="small" />
                ) : (
                  <AddLocationAltIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={type ?? otherLabel} />
            </MenuItem>
          );
        })}
        {groups.flatMap((group) => [
          subheader(groupLabels[group.where]),
          ...group.places.map((place) => {
            const checked =
              target.type === "entry" && target.entryId === place.entry.id;
            return (
              <MenuItem
                key={place.entry.id}
                role="menuitemradio"
                aria-checked={checked}
                selected={checked}
                sx={itemSx}
                onClick={() =>
                  choose({ type: "entry", entryId: place.entry.id })
                }
              >
                <ListItemIcon>
                  <WorldMapPinIcon entry={place.entry} />
                </ListItemIcon>
                <ListItemText
                  primary={place.entry.name}
                  secondary={
                    place.where === "elsewhere"
                      ? (place.parentName ??
                        t("worlds.maps.pins.top-level", "Not inside anything"))
                      : undefined
                  }
                />
              </MenuItem>
            );
          }),
        ])}
        {newTypes.length === 0 && groups.length === 0 && (
          <Typography
            component="li"
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 1 }}
          >
            {t("worlds.maps.pins.no-matches", "No places match")}
          </Typography>
        )}
      </MenuList>
    </Box>
  );
}
