import BrushIcon from "@mui/icons-material/Brush";
import FormatColorResetIcon from "@mui/icons-material/FormatColorReset";
import PanToolIcon from "@mui/icons-material/PanTool";
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
  // Painting needs a grid.
  canPaint: boolean;
  background: {
    width: number;
    naturalWidth: number;
    onResize: (width: number, commit: boolean) => void;
  } | null;
  // Extra controls at the end of the row.
  actions?: ReactNode;
}

// The tools for editing a map: pan, brush, path, eraser and the background
// image, then the settings of whichever is in hand.
export function WorldMapToolbar(props: WorldMapToolbarProps) {
  const {
    tool,
    onToolChange,
    settings,
    onSettingsChange,
    canPaint,
    background,
    actions,
  } = props;
  const { t } = useTranslation();

  const tools: { value: WorldMapTool; label: string; icon: ReactNode }[] = [
    {
      value: "pan",
      label: t("worlds.maps.tools.pan", "Move around"),
      icon: <PanToolIcon fontSize="small" />,
    },
    ...(canPaint
      ? [
          {
            value: "brush" as const,
            label: t("worlds.maps.tools.brush", "Paint terrain"),
            icon: <BrushIcon fontSize="small" />,
          },
          {
            value: "path" as const,
            label: t("worlds.maps.tools.path", "Draw paths"),
            icon: <RouteIcon fontSize="small" />,
          },
          {
            value: "eraser" as const,
            label: t("worlds.maps.tools.eraser", "Erase"),
            icon: <FormatColorResetIcon fontSize="small" />,
          },
        ]
      : []),
    ...(background
      ? [
          {
            value: "background" as const,
            label: t("worlds.maps.tools.background", "Move background"),
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
      <ToggleButtonGroup
        exclusive
        size="small"
        value={tool}
        onChange={(_, value: WorldMapTool | null) =>
          value && onToolChange(value)
        }
      >
        {tools.map((option) => (
          <Tooltip key={option.value} title={option.label}>
            <ToggleButton value={option.value} aria-label={option.label}>
              {option.icon}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>

      {tool === "brush" && (
        <Box
          role="radiogroup"
          aria-label={t("worlds.maps.terrain.label", "Terrain")}
          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
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
                    width: 28,
                    height: 28,
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
            <ToggleButton key={size} value={size} sx={{ px: 1.25 }}>
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
          <ToggleButton value="all" sx={{ px: 1.25 }}>
            {t("worlds.maps.eraser.all", "Everything")}
          </ToggleButton>
          <ToggleButton value="path" sx={{ px: 1.25 }}>
            {t("worlds.maps.eraser.path", "Paths only")}
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {tool === "background" && background && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flex: "1 1 240px",
            maxWidth: 360,
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
    </Paper>
  );
}
