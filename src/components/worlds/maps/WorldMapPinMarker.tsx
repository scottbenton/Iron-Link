import {
  Box,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { PointerEvent, ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Point } from "lib/worldMap/grid";

import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldMapPinIcon } from "./WorldMapPinIcon";

const MARKER_SIZE = 32;

// Entries pinned to one spot on the map. A single pin opens its entry; a
// spot holding several lists them first. Names show once the map is zoomed
// in far enough to fit them. With the pin tool in hand, choosing a pin
// selects it instead (`onSelect`), dragging the marker moves every place on
// the spot, and dragging a place out of the list moves just that one.
export function WorldMapPinMarker({
  entries,
  screen,
  showLabel,
  navigation,
  onSelect,
  onDragStart,
  dragging,
  selected,
}: {
  entries: IWorldEntry[];
  screen: Point;
  showLabel: boolean;
  navigation: Pick<WorldNavigation, "getLinkProps">;
  onSelect?: (entry: IWorldEntry) => void;
  // Without an entry id the whole marker is being dragged.
  onDragStart?: (event: PointerEvent<HTMLElement>, entryId?: string) => void;
  // The id being dragged (an entry's, or anything else for the whole
  // marker) and where it is.
  dragging?: { id: string; screen: Point } | null;
  selected?: boolean;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const draggedEntry = entries.find((entry) => entry.id === dragging?.id);
  const draggingOut = !!draggedEntry && entries.length > 1;
  // Hide the list once a place is dragged out of it. It stays mounted, as the
  // row being dragged holds the pointer until it is let go.
  useEffect(() => {
    if (draggingOut) setAnchor(null);
  }, [draggingOut]);

  const linkProps = (entry: IWorldEntry) =>
    navigation.getLinkProps({
      type: "entry",
      categoryId: entry.categoryId,
      entryId: entry.id,
    });
  const shown = draggingOut
    ? entries.filter((entry) => entry !== draggedEntry)
    : entries;
  const [first] = shown;
  const labelFor = (list: IWorldEntry[]) =>
    list.length === 1
      ? list[0].name
      : t("worlds.maps.pin-group", "{{count}} places", {
          count: list.length,
        });
  const label = labelFor(entries);
  const markerFor = (list: IWorldEntry[]): ReactNode => (
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
        {list.length === 1 ? (
          <WorldMapPinIcon entry={list[0]} />
        ) : (
          <Typography variant="body2" fontWeight="bold">
            {list.length}
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
          {labelFor(list)}
        </Typography>
      )}
    </>
  );
  const placeAt = (point: Point, faded: boolean) =>
    ({
      position: "absolute",
      left: point.x,
      top: point.y,
      transform: `translate(-50%, -${MARKER_SIZE / 2}px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      borderRadius: 1,
      opacity: faded ? 0.6 : 1,
      touchAction: "none",
      // A 44px target around the 32px marker, for fingers.
      "&::before": {
        content: '""',
        position: "absolute",
        top: (MARKER_SIZE - 44) / 2,
        left: "50%",
        width: 44,
        height: 44,
        transform: "translateX(-50%)",
      },
      "&:focus-visible": {
        outline: "2px solid",
        outlineColor: "primary.main",
      },
    }) as const;
  const movingWhole = !!dragging && !draggingOut;
  const sx = placeAt(movingWhole ? dragging.screen : screen, movingWhole);

  if (entries.length === 1 && !onSelect)
    return (
      <ButtonBase
        component={LinkComponent}
        {...linkProps(first)}
        aria-label={first.name}
        sx={sx}
      >
        {markerFor(entries)}
      </ButtonBase>
    );

  return (
    <>
      <ButtonBase
        aria-label={label}
        aria-haspopup={entries.length > 1 ? "menu" : undefined}
        aria-pressed={entries.length === 1 && onSelect ? !!selected : undefined}
        onPointerDown={(event) => onDragStart?.(event)}
        onClick={(event) => {
          if (entries.length > 1) setAnchor(event.currentTarget);
          else onSelect?.(first);
        }}
        sx={sx}
      >
        {markerFor(shown)}
      </ButtonBase>
      {draggingOut && dragging && (
        <Box aria-hidden="true" sx={placeAt(dragging.screen, true)}>
          {markerFor([draggedEntry])}
        </Box>
      )}
      <Menu
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        keepMounted={!!onDragStart}
      >
        {entries.map((entry) => (
          <MenuItem
            key={entry.id}
            {...(onSelect
              ? {
                  onClick: () => {
                    setAnchor(null);
                    onSelect(entry);
                  },
                  onPointerDown: (event: PointerEvent<HTMLElement>) =>
                    onDragStart?.(event, entry.id),
                  sx: onDragStart ? { touchAction: "none" } : undefined,
                }
              : { component: LinkComponent, ...linkProps(entry) })}
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
