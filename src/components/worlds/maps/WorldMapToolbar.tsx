import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BrushIcon from "@mui/icons-material/Brush";
import PanToolIcon from "@mui/icons-material/PanTool";
import PushPinIcon from "@mui/icons-material/PushPin";
import RouteIcon from "@mui/icons-material/Route";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import {
  Box,
  Paper,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { PaintSettings } from "lib/worldMap/paint";
import { getTerrainColor } from "lib/worldMap/terrain";

import { WorldMapEraserIcon } from "./WorldMapEraserIcon";
import { WorldMapTool, getTerrainLabel } from "./worldMapTools";

export interface WorldMapToolbarProps {
  tool: WorldMapTool;
  onToolChange: (tool: WorldMapTool) => void;
  settings: PaintSettings;
  // Painting needs a grid; pins need a category that nests entries.
  canPaint: boolean;
  canPin: boolean;
  // Moving the background needs one.
  canMoveBackground: boolean;
  // What the pin tool puts down, chosen in its popup. Gets a function that
  // closes the popup.
  pinMenu?: (close: () => void) => ReactNode;
  // The pin tool's icon: what it will put down.
  pinIcon?: ReactNode;
  // Extra controls at the end of the row, then the map options.
  actions?: ReactNode;
  options?: ReactNode;
  // Phone paint mode: the tools in a row along the bottom of the screen,
  // with labels, everything at least 44px.
  touch?: boolean;
}

const TOUCH = 44;

type MenuTool = "pin";

// The tools for editing a map in one row that never changes size: pan,
// brush, path, eraser, pins and the background image. The pin tool's button
// opens a popup for which place it puts down; the brush and eraser keep
// their settings over the map (WorldMapPaintPicker).
export function WorldMapToolbar(props: WorldMapToolbarProps) {
  const {
    tool,
    onToolChange,
    settings,
    canPaint,
    canPin,
    canMoveBackground,
    pinMenu,
    pinIcon,
    actions,
    options,
    touch = false,
  } = props;
  const { t } = useTranslation();
  const [menu, setMenu] = useState<{
    tool: MenuTool;
    anchor: HTMLElement;
  } | null>(null);
  const closeMenu = () => setMenu(null);
  const popupId = useId();

  const terrainLabel = getTerrainLabel(t, settings.terrain);
  const tools: {
    value: WorldMapTool;
    label: string;
    shortLabel: string;
    icon: ReactNode;
    // Tools whose button opens their settings.
    menu?: MenuTool;
  }[] = [
    {
      value: "pan",
      label: canPin
        ? t("worlds.maps.tools.pan-and-move", "Move around, or drag a place")
        : t("worlds.maps.tools.pan", "Move around"),
      shortLabel: t("worlds.maps.tools.pan-short", "Pan"),
      icon: <PanToolIcon fontSize="small" />,
    },
    ...(canPaint
      ? [
          {
            value: "brush" as const,
            label: t("worlds.maps.tools.brush-with", "Paint {{terrain}}", {
              terrain: terrainLabel,
            }),
            shortLabel: t("worlds.maps.tools.brush-short", "Brush"),
            icon: (
              <Box sx={{ position: "relative", display: "flex" }}>
                <BrushIcon fontSize="small" />
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    right: -4,
                    bottom: -3,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: getTerrainColor(settings.terrain),
                    border: `1px solid ${theme.palette.background.paper}`,
                  })}
                />
              </Box>
            ),
          },
          {
            value: "path" as const,
            label: t(
              "worlds.maps.tools.path-toggle",
              "Draw paths (start on a path to remove it)",
            ),
            shortLabel: t("worlds.maps.tools.path-short", "Path"),
            icon: <RouteIcon fontSize="small" />,
          },
          {
            value: "eraser" as const,
            label: t("worlds.maps.tools.eraser", "Erase"),
            shortLabel: t("worlds.maps.tools.eraser-short", "Eraser"),
            icon: <WorldMapEraserIcon fontSize="small" />,
          },
        ]
      : []),
    ...(canPin
      ? [
          {
            value: "pin" as const,
            label: t("worlds.maps.tools.pin", "Add places to the map"),
            shortLabel: t("worlds.maps.tools.pin-short", "Add"),
            icon: pinIcon ?? <PushPinIcon fontSize="small" />,
            menu: "pin" as const,
          },
        ]
      : []),
    ...(canMoveBackground
      ? [
          {
            value: "background" as const,
            label: t("worlds.maps.tools.background", "Move background"),
            shortLabel: t("worlds.maps.tools.background-short", "Image"),
            icon: <WallpaperIcon fontSize="small" />,
          },
        ]
      : []),
  ];

  const toolButtons = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={tool}
      aria-label={t("worlds.maps.tools.choose", "Tool")}
      sx={touch ? { display: "flex", width: "100%" } : undefined}
    >
      {tools.map((option) => {
        const open = menu?.tool === option.menu && !!option.menu;
        const button = (
          <ToggleButton
            key={option.value}
            value={option.value}
            aria-label={touch ? undefined : option.label}
            aria-haspopup={option.menu ? "dialog" : undefined}
            aria-expanded={option.menu ? open : undefined}
            aria-controls={open ? popupId : undefined}
            onClick={(event) => {
              onToolChange(option.value);
              if (option.menu)
                setMenu({ tool: option.menu, anchor: event.currentTarget });
            }}
            sx={
              touch
                ? {
                    flex: 1,
                    minHeight: TOUCH + 12,
                    flexDirection: "column",
                    gap: 0.25,
                    fontSize: 11,
                    lineHeight: 1.2,
                    textTransform: "none",
                  }
                : { gap: 0.25, pr: option.menu ? 0.5 : undefined }
            }
          >
            {option.icon}
            {touch ? (
              <Box component="span" sx={{ display: "flex" }}>
                {option.shortLabel}
                {option.menu && (
                  <ArrowDropDownIcon sx={{ fontSize: 14, mr: -0.5 }} />
                )}
              </Box>
            ) : (
              option.menu && (
                <ArrowDropDownIcon sx={{ fontSize: 16, ml: -0.25 }} />
              )
            )}
          </ToggleButton>
        );
        return touch ? (
          button
        ) : (
          <Tooltip key={option.value} title={option.label}>
            {button}
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );

  const popup = (
    <Popover
      id={popupId}
      open={!!menu}
      anchorEl={menu?.anchor}
      onClose={closeMenu}
      // Gone at once when closed, so the next press lands on the map.
      transitionDuration={{ enter: 150, exit: 0 }}
      anchorOrigin={{ vertical: touch ? "top" : "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: touch ? "bottom" : "top",
        horizontal: "left",
      }}
      slotProps={{
        paper: {
          sx: {
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            maxWidth: "calc(100vw - 16px)",
          },
          "aria-label": t("worlds.maps.pins.settings", "What to pin"),
        },
      }}
    >
      {menu?.tool === "pin" && pinMenu?.(closeMenu)}
    </Popover>
  );

  if (touch)
    return (
      <Box
        role="toolbar"
        aria-label={t("worlds.maps.tools.label", "Map tools")}
        sx={{
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          pb: "env(safe-area-inset-bottom)",
        }}
      >
        {actions && (
          <Box sx={{ display: "flex", gap: 1, px: 1, py: 0.5 }}>{actions}</Box>
        )}
        {toolButtons}
        {popup}
      </Box>
    );

  return (
    <Paper
      variant="outlined"
      role="toolbar"
      aria-label={t("worlds.maps.tools.label", "Map tools")}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
      }}
    >
      {toolButtons}
      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
        {actions}
        {options}
      </Box>
      {popup}
    </Paper>
  );
}
