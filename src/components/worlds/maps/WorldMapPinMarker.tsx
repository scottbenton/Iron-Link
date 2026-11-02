import {
  Box,
  ButtonBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import {
  DragEvent,
  MouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Point, SQUARE_SIZE } from "lib/worldMap/grid";

import { IWorldEntry } from "services/worldEntries.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldMapPinIcon } from "./WorldMapPinIcon";

// A pin is its place's icon, with no badge around it, drawn about this much
// of a cell across so it sits in its cell and scales with the map. Maps
// without a grid size it as if it sat in a cell of the default size.
const CELL_FILL = 0.7;
const MAX_ICON = 64;
// Below this the icon would be unreadable, so the pin is a dot.
const MIN_ICON = 14;
const DOT = 8;
// A dark halo keeps the glyph readable on any terrain or image.
const HALO = "drop-shadow(0 0 1px #000) drop-shadow(0 0 2px rgba(0,0,0,0.8))";

function getPinIconSize(scale: number): number {
  return Math.min(MAX_ICON, SQUARE_SIZE * scale * CELL_FILL);
}

// Entries pinned to one spot on the map. A single pin opens its entry; a
// spot holding several lists them first, and shows the first one's icon with
// a count. Names show once the map is zoomed in far enough to fit them. With the pin tool in hand, choosing a pin
// selects it instead (`onSelect`), dragging the marker moves every place on
// the spot, and dragging a place out of the list moves just that one.
export function WorldMapPinMarker({
  entries,
  screen,
  scale,
  showLabel,
  navigation,
  onSelect,
  onDragStart,
  dragging,
  selected,
}: {
  entries: IWorldEntry[];
  screen: Point;
  // The map's zoom, which sizes the pin.
  scale: number;
  showLabel: boolean;
  // Without navigation (the second screen) the marker is only a picture.
  navigation?: Pick<WorldNavigation, "getLinkProps">;
  onSelect?: (entry: IWorldEntry) => void;
  // Without an entry id the whole marker is being dragged.
  onDragStart?: (
    event: ReactPointerEvent<HTMLElement>,
    entryId?: string,
  ) => void;
  // The id being dragged (an entry's, or anything else for the whole
  // marker) and where it is.
  dragging?: { id: string; screen: Point } | null;
  selected?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const draggedEntry = entries.find((entry) => entry.id === dragging?.id);
  const draggingOut = !!draggedEntry && entries.length > 1;
  // Hide the list once a place is dragged out of it. It stays mounted, as the
  // row being dragged holds the pointer until it is let go.
  useEffect(() => {
    if (draggingOut) setAnchor(null);
  }, [draggingOut]);

  const linkProps = (
    nav: Pick<WorldNavigation, "getLinkProps">,
    entry: IWorldEntry,
  ) =>
    nav.getLinkProps({
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
  const iconSize = getPinIconSize(scale);
  const dot = iconSize < MIN_ICON;
  const size = dot ? DOT : iconSize;
  const markerFor = (list: IWorldEntry[]): ReactNode => (
    <>
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "common.white",
          filter: selected
            ? `drop-shadow(0 0 2px ${theme.palette.primary.main}) drop-shadow(0 0 2px ${theme.palette.primary.main})`
            : HALO,
          ...(dot
            ? {
                borderRadius: "50%",
                bgcolor: selected ? "primary.main" : "common.white",
              }
            : {
                // The icon fills the pin: glyphs, tiles and pictures alike.
                "& > :not(.pin-count)": {
                  width: "100% !important",
                  height: "100% !important",
                  minWidth: 0,
                  bgcolor: "transparent",
                },
                "& svg": { width: "100%", height: "100%" },
                "& img": { borderRadius: "4px" },
              }),
        }}
      >
        {!dot && <WorldMapPinIcon entry={list[0]} />}
        {list.length > 1 && !dot && (
          <Box
            className="pin-count"
            sx={{
              position: "absolute",
              right: dot ? -10 : -6,
              top: dot ? -8 : -4,
              minWidth: 16,
              height: 16,
              px: 0.5,
              borderRadius: 8,
              bgcolor: "grey.900",
              border: 1,
              borderColor: "grey.400",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "14px",
              textAlign: "center",
              filter: "none",
            }}
          >
            {list.length}
          </Box>
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
  // A pin being carried is lifted: a little larger, and fully drawn, while a
  // faded copy stays where it was.
  const placeAt = (point: Point, look: "rest" | "lifted" | "ghost") =>
    ({
      position: "absolute",
      left: point.x,
      top: point.y,
      transform: `translate(-50%, -${size / 2}px)${look === "lifted" ? " scale(1.2)" : ""}`,
      transformOrigin: `50% ${size / 2}px`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      borderRadius: 1,
      opacity: look === "ghost" ? 0.35 : 1,
      pointerEvents: look === "ghost" ? "none" : undefined,
      zIndex: look === "lifted" ? 1 : undefined,
      cursor: onDragStart
        ? look === "lifted"
          ? "grabbing"
          : "grab"
        : undefined,
      touchAction: "none",
      // A long press lifts the pin rather than opening the browser's menu.
      WebkitTouchCallout: "none",
      // At least a 44px target around the pin, for fingers.
      "&::before": {
        content: '""',
        position: "absolute",
        top: (size - 44) / 2,
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
  const sx = movingWhole
    ? placeAt(dragging.screen, "lifted")
    : placeAt(screen, "rest");
  const ghost = movingWhole && (
    <Box aria-hidden="true" sx={placeAt(screen, "ghost")}>
      {markerFor(entries)}
    </Box>
  );
  // Editors drag pins (`onDragStart`), so a pointer down on one may start a
  // drag; a click that never moved still opens it.
  const dragProps = onDragStart && {
    draggable: false,
    onDragStart: (event: DragEvent) => event.preventDefault(),
    onContextMenu: (event: MouseEvent) => {
      if ((event.nativeEvent as PointerEvent).pointerType !== "mouse")
        event.preventDefault();
    },
  };

  if (!navigation)
    return (
      <Box sx={sx} role="img" aria-label={label}>
        {markerFor(entries)}
      </Box>
    );

  if (entries.length === 1 && !onSelect)
    return (
      <>
        {ghost}
        <ButtonBase
          disableRipple={!!onDragStart}
          component={LinkComponent}
          {...linkProps(navigation, first)}
          {...dragProps}
          onPointerDown={(event: ReactPointerEvent<HTMLElement>) =>
            onDragStart?.(event)
          }
          aria-label={first.name}
          sx={sx}
        >
          {markerFor(entries)}
        </ButtonBase>
      </>
    );

  return (
    <>
      {ghost}
      <ButtonBase
        disableRipple={!!onDragStart}
        {...dragProps}
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
        <Box aria-hidden="true" sx={placeAt(dragging.screen, "lifted")}>
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
                }
              : { component: LinkComponent, ...linkProps(navigation, entry) })}
            {...(onDragStart && {
              ...dragProps,
              // Dragging a row out of the list moves just that place.
              onPointerDown: (event: ReactPointerEvent<HTMLElement>) =>
                onDragStart(event, entry.id),
              sx: { touchAction: "none", WebkitTouchCallout: "none" },
            })}
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
