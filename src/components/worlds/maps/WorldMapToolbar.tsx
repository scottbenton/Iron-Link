import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BrushIcon from "@mui/icons-material/Brush";
import PanToolIcon from "@mui/icons-material/PanTool";
import PushPinIcon from "@mui/icons-material/PushPin";
import RouteIcon from "@mui/icons-material/Route";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import {
  Box,
  ButtonBase,
  Paper,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BRUSH_SIZES,
  BrushSize,
  EraserTarget,
  PaintSettings,
} from "lib/worldMap/paint";
import { WORLD_MAP_TERRAINS, getTerrainColor } from "lib/worldMap/terrain";

import { WorldMapEraserIcon } from "./WorldMapEraserIcon";
import { WorldMapTool, getTerrainLabel } from "./worldMapTools";

export interface WorldMapToolbarProps {
  tool: WorldMapTool;
  onToolChange: (tool: WorldMapTool) => void;
  settings: PaintSettings;
  onSettingsChange: (settings: PaintSettings) => void;
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

type MenuTool = "brush" | "eraser" | "pin";

// The tools for editing a map in one row that never changes size: pan,
// brush, path, eraser, pins and the background image. Tools with settings
// (the brush's terrain and size, what the eraser takes, which place a pin
// puts down) open a popup from their button.
export function WorldMapToolbar(props: WorldMapToolbarProps) {
  const {
    tool,
    onToolChange,
    settings,
    onSettingsChange,
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
            menu: "brush" as const,
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
            menu: "eraser" as const,
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
  const sizeLabels: Record<BrushSize, string> = {
    0: t("worlds.maps.brush.small", "Small"),
    1: t("worlds.maps.brush.medium", "Medium"),
    2: t("worlds.maps.brush.large", "Large"),
  };
  const optionSx = touch ? { minHeight: TOUCH, px: 1.5 } : { px: 1.25 };

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

  const sizePicker = (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        component="p"
        id={`${popupId}-size`}
      >
        {t("worlds.maps.brush.size", "Brush size")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={settings.size}
        aria-labelledby={`${popupId}-size`}
        onChange={(_, value: BrushSize | null) =>
          value !== null && onSettingsChange({ ...settings, size: value })
        }
      >
        {BRUSH_SIZES.map((size) => (
          <ToggleButton key={size} value={size} sx={optionSx}>
            {sizeLabels[size]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );

  const brushMenu = (
    <>
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          component="p"
          id={`${popupId}-terrain`}
        >
          {t("worlds.maps.terrain.label", "Terrain")}
        </Typography>
        <Box
          role="radiogroup"
          aria-labelledby={`${popupId}-terrain`}
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(6, ${touch ? TOUCH : 32}px)`,
            gap: 1,
          }}
        >
          {WORLD_MAP_TERRAINS.map((terrain) => {
            const selected = settings.terrain === terrain.key;
            const label = getTerrainLabel(t, terrain.key);
            return (
              <Tooltip key={terrain.key} title={label}>
                <ButtonBase
                  role="radio"
                  aria-checked={selected}
                  aria-label={label}
                  onClick={() => {
                    onSettingsChange({ ...settings, terrain: terrain.key });
                    closeMenu();
                  }}
                  sx={(theme) => ({
                    width: touch ? TOUCH : 32,
                    height: touch ? TOUCH : 32,
                    borderRadius: 0.5,
                    bgcolor: terrain.color,
                    border: `1px solid ${theme.palette.divider}`,
                    outline: selected
                      ? `2px solid ${theme.palette.primary.main}`
                      : "none",
                    outlineOffset: 2,
                    "&.Mui-focusVisible": {
                      outline: `2px solid ${theme.palette.primary.main}`,
                    },
                  })}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
      {sizePicker}
    </>
  );

  const eraserMenu = (
    <>
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          component="p"
          id={`${popupId}-erase`}
        >
          {t("worlds.maps.eraser.label", "Erase")}
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.eraser}
          aria-labelledby={`${popupId}-erase`}
          onChange={(_, value: EraserTarget | null) =>
            value && onSettingsChange({ ...settings, eraser: value })
          }
        >
          <ToggleButton value="all" sx={optionSx}>
            {t("worlds.maps.eraser.all", "Everything")}
          </ToggleButton>
          <ToggleButton value="path" sx={optionSx}>
            {t("worlds.maps.eraser.path", "Paths only")}
          </ToggleButton>
          <ToggleButton value="terrain" sx={optionSx}>
            {t("worlds.maps.eraser.terrain", "Terrain only")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {sizePicker}
    </>
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
          "aria-label":
            menu?.tool === "brush"
              ? t("worlds.maps.brush.settings", "Brush settings")
              : menu?.tool === "eraser"
                ? t("worlds.maps.eraser.settings", "Eraser settings")
                : t("worlds.maps.pins.settings", "What to pin"),
        },
      }}
    >
      {menu?.tool === "brush" && brushMenu}
      {menu?.tool === "eraser" && eraserMenu}
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
