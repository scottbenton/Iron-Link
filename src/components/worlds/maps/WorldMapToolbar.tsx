import BrushIcon from "@mui/icons-material/Brush";
import FormatColorResetIcon from "@mui/icons-material/FormatColorReset";
import PanToolIcon from "@mui/icons-material/PanTool";
import PushPinIcon from "@mui/icons-material/PushPin";
import RouteIcon from "@mui/icons-material/Route";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import {
  Box,
  ButtonBase,
  Paper,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  BRUSH_SIZES,
  BrushSize,
  EraserTarget,
  PaintSettings,
} from "lib/worldMap/paint";
import { WORLD_MAP_TERRAINS } from "lib/worldMap/terrain";

import { WorldMapTool, getTerrainLabel } from "./worldMapTools";

// Background sizes run from a sixteenth to sixteen times the image's own
// width, on a log scale so each step feels the same.
const SIZE_RANGE = 4;

export interface WorldMapToolbarProps {
  tool: WorldMapTool;
  onToolChange: (tool: WorldMapTool) => void;
  settings: PaintSettings;
  onSettingsChange: (settings: PaintSettings) => void;
  // Painting needs a grid; pins need a category that nests entries.
  canPaint: boolean;
  canPin: boolean;
  // The pin tool's settings, shown while it is in hand.
  pinTools?: ReactNode;
  background: {
    width: number;
    naturalWidth: number;
    onResize: (width: number, commit: boolean) => void;
  } | null;
  // Extra controls at the end of the row.
  actions?: ReactNode;
  // Phone paint mode: the tools in a row along the bottom of the screen,
  // the settings above them, everything at least 44px.
  touch?: boolean;
}

const TOUCH = 44;

// The tools for editing a map: pan, brush, path, eraser, pins and the
// background image, then the settings of whichever is in hand.
export function WorldMapToolbar(props: WorldMapToolbarProps) {
  const {
    tool,
    onToolChange,
    settings,
    onSettingsChange,
    canPaint,
    canPin,
    pinTools,
    background,
    actions,
    touch = false,
  } = props;
  const { t } = useTranslation();

  const tools: {
    value: WorldMapTool;
    label: string;
    shortLabel: string;
    icon: ReactNode;
  }[] = [
    {
      value: "pan",
      label: t("worlds.maps.tools.pan", "Move around"),
      shortLabel: t("worlds.maps.tools.pan-short", "Pan"),
      icon: <PanToolIcon fontSize="small" />,
    },
    ...(canPaint
      ? [
          {
            value: "brush" as const,
            label: t("worlds.maps.tools.brush", "Paint terrain"),
            shortLabel: t("worlds.maps.tools.brush-short", "Brush"),
            icon: <BrushIcon fontSize="small" />,
          },
          {
            value: "path" as const,
            label: t("worlds.maps.tools.path", "Draw paths"),
            shortLabel: t("worlds.maps.tools.path-short", "Path"),
            icon: <RouteIcon fontSize="small" />,
          },
          {
            value: "eraser" as const,
            label: t("worlds.maps.tools.eraser", "Erase"),
            shortLabel: t("worlds.maps.tools.eraser-short", "Eraser"),
            icon: <FormatColorResetIcon fontSize="small" />,
          },
        ]
      : []),
    ...(canPin
      ? [
          {
            value: "pin" as const,
            label: t("worlds.maps.tools.pin", "Place pins"),
            shortLabel: t("worlds.maps.tools.pin-short", "Pin"),
            icon: <PushPinIcon fontSize="small" />,
          },
        ]
      : []),
    ...(background
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

  const toolButtons = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={tool}
      onChange={(_, value: WorldMapTool | null) => value && onToolChange(value)}
      sx={touch ? { display: "flex", width: "100%" } : undefined}
    >
      {tools.map((option) =>
        touch ? (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{
              flex: 1,
              minHeight: TOUCH + 12,
              flexDirection: "column",
              gap: 0.25,
              fontSize: 11,
              lineHeight: 1.2,
              textTransform: "none",
            }}
          >
            {option.icon}
            {option.shortLabel}
          </ToggleButton>
        ) : (
          <Tooltip key={option.value} title={option.label}>
            <ToggleButton value={option.value} aria-label={option.label}>
              {option.icon}
            </ToggleButton>
          </Tooltip>
        ),
      )}
    </ToggleButtonGroup>
  );
  const optionSx = touch ? { minHeight: TOUCH, px: 1.5 } : { px: 1.25 };

  const settingsControls = (
    <>
      {tool === "brush" && (
        <Box
          role="radiogroup"
          aria-label={t("worlds.maps.terrain.label", "Terrain")}
          sx={{
            display: "flex",
            flexWrap: touch ? "nowrap" : "wrap",
            gap: touch ? 1 : 0.5,
            p: touch ? 0.5 : 0,
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
                  onClick={() =>
                    onSettingsChange({ ...settings, terrain: terrain.key })
                  }
                  sx={(theme) => ({
                    width: touch ? TOUCH : 28,
                    height: touch ? TOUCH : 28,
                    flexShrink: 0,
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
      )}

      {(tool === "brush" || tool === "eraser") && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.size}
          aria-label={t("worlds.maps.brush.size", "Brush size")}
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
      )}

      {tool === "eraser" && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={settings.eraser}
          aria-label={t("worlds.maps.eraser.label", "Erase")}
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
          <ToggleButton value="terrain" sx={{ px: 1.25 }}>
            {t("worlds.maps.eraser.terrain", "Terrain only")}
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {tool === "pin" && pinTools}

      {tool === "background" && background && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: "1 1 240px",
            maxWidth: 360,
            minHeight: touch ? TOUCH : undefined,
            px: touch ? 1 : 0,
          }}
        >
          <Typography variant="body2" color="text.secondary" id="map-bg-size">
            {t("worlds.maps.background.size", "Size")}
          </Typography>
          <Slider
            size="small"
            aria-labelledby="map-bg-size"
            min={-SIZE_RANGE}
            max={SIZE_RANGE}
            step={0.05}
            value={Math.log2(background.width / background.naturalWidth)}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(2 ** value * 100)}%`}
            getAriaValueText={(value) => `${Math.round(2 ** value * 100)}%`}
            onChange={(_, value) =>
              background.onResize(
                background.naturalWidth * 2 ** (value as number),
                false,
              )
            }
            onChangeCommitted={(_, value) =>
              background.onResize(
                background.naturalWidth * 2 ** (value as number),
                true,
              )
            }
          />
        </Box>
      )}

      {actions && (
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>{actions}</Box>
      )}
    </>
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.5,
            overflowX: "auto",
            "&:empty": { display: "none" },
          }}
        >
          {settingsControls}
        </Box>
        {toolButtons}
      </Box>
    );

  return (
    <Paper
      variant="outlined"
      role="toolbar"
      aria-label={t("worlds.maps.tools.label", "Map tools")}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
        p: 1,
      }}
    >
      {toolButtons}
      {settingsControls}
    </Paper>
  );
}
