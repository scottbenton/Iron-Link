import {
  Box,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { PointerEvent, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Point } from "lib/worldMap/grid";

import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldMapPinIcon } from "./WorldMapPinIcon";

const MARKER_SIZE = 32;

// Entries pinned to one spot on the map. A single pin opens its entry; a
// spot holding several lists them first. Names show once the map is zoomed
// in far enough to fit them.
export function WorldMapPinMarker({
  entries,
  screen,
  showLabel,
  navigation,
  onPointerDown,
  dragging,
  selected,
}: {
  entries: IWorldEntry[];
  screen: Point;
  showLabel: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
  // Lets the map's pin tool drag the marker instead of opening it.
  onPointerDown?: (
    event: PointerEvent<HTMLElement>,
    entry: IWorldEntry,
  ) => void;
  dragging?: boolean;
  selected?: boolean;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [first] = entries;
  const linkProps = (entry: IWorldEntry) =>
    navigation.getLinkProps({
      type: "entry",
      categoryId: entry.categoryId,
      entryId: entry.id,
    });
  const label =
    entries.length === 1
      ? first.name
      : t("worlds.maps.pin-group", "{{count}} places", {
          count: entries.length,
        });
  const marker: ReactNode = (
    <>
      <Box
        sx={{
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          borderRadius: "50%",
          bgcolor: "grey.900",
          border: 2,
          borderColor: selected ? "primary.main" : "grey.300",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: 2,
          color: "common.white",
          "& img": { width: "100%", height: "100%", borderRadius: 0 },
        }}
      >
        {entries.length === 1 ? (
          <WorldMapPinIcon entry={first} />
        ) : (
          <Typography variant="body2" fontWeight="bold">
            {entries.length}
          </Typography>
        )}
      </Box>
      {showLabel && (
        <Typography
          component="span"
          variant="caption"
          sx={{
            mt: 0.25,
            px: 0.5,
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "common.white",
            textShadow: "0 0 3px #000, 0 0 3px #000",
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      )}
    </>
  );
  const sx = {
    position: "absolute",
    left: screen.x,
    top: screen.y,
    transform: `translate(-50%, -${MARKER_SIZE / 2}px)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 1,
    opacity: dragging ? 0.6 : 1,
    touchAction: "none",
    "&:focus-visible": {
      outline: "2px solid",
      outlineColor: "primary.main",
    },
  } as const;

  if (entries.length === 1 && !onPointerDown)
    return (
      <ButtonBase
        component={LinkComponent}
        {...linkProps(first)}
        aria-label={first.name}
        sx={sx}
      >
        {marker}
      </ButtonBase>
    );

  return (
    <>
      <ButtonBase
        aria-label={label}
        aria-haspopup={entries.length > 1 ? "menu" : undefined}
        onPointerDown={(event) => {
          if (entries.length === 1) onPointerDown?.(event, first);
        }}
        onClick={(event) => {
          if (entries.length > 1) setAnchor(event.currentTarget);
        }}
        sx={sx}
      >
        {marker}
      </ButtonBase>
      <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}>
        {entries.map((entry) => (
          <MenuItem
            key={entry.id}
            component={LinkComponent}
            {...linkProps(entry)}
            onPointerDown={(event: PointerEvent<HTMLElement>) =>
              onPointerDown?.(event, entry)
            }
          >
            <ListItemIcon>
              <WorldMapPinIcon entry={entry} />
            </ListItemIcon>
            <ListItemText>{entry.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
