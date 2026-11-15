import {
  Box,
  ButtonBase,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  BRUSH_SIZES,
  BrushSize,
  EraserTarget,
  PaintSettings,
} from "lib/worldMap/paint";
import { WORLD_MAP_TERRAINS } from "lib/worldMap/terrain";

import { getTerrainLabel } from "./worldMapTools";

const TOUCH = 44;

// Over the map, top left, while the brush or eraser is in hand: the brush's
// terrain and size, or what the eraser takes and its size, each one tap
// away.
export function WorldMapPaintPicker({
  settings,
  onSettingsChange,
  touch = false,
}: {
  settings: PaintSettings;
  onSettingsChange: (settings: PaintSettings) => void;
  touch?: boolean;
}) {
  const { t } = useTranslation();
  const swatch = touch ? TOUCH : 24;
  const sizeLabels: Record<BrushSize, string> = {
    0: t("worlds.maps.brush.small", "Small"),
    1: t("worlds.maps.brush.medium", "Medium"),
    2: t("worlds.maps.brush.large", "Large"),
  };
  const optionSx = {
    minHeight: touch ? TOUCH : 32,
    px: touch ? 1.5 : 1,
    py: 0,
    textTransform: "none",
  };

  const terrains = (
    <Box
      role="radiogroup"
      aria-label={t("worlds.maps.terrain.label", "Terrain")}
      sx={{
        display: "grid",
        gridTemplateColumns: touch
          ? `repeat(6, ${swatch}px)`
          : `repeat(${WORLD_MAP_TERRAINS.length}, ${swatch}px)`,
        gap: touch ? 0.75 : 0.5,
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
                width: swatch,
                height: swatch,
                borderRadius: 0.5,
                bgcolor: terrain.color,
                border: `1px solid ${theme.palette.divider}`,
                outline: selected
                  ? `2px solid ${theme.palette.primary.main}`
                  : "none",
                outlineOffset: 1,
                "&.Mui-focusVisible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                },
              })}
            />
          </Tooltip>
        );
      })}
    </Box>
  );

  const eraserTargets = (
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
      <ToggleButton value="terrain" sx={optionSx}>
        {t("worlds.maps.eraser.terrain", "Terrain only")}
      </ToggleButton>
    </ToggleButtonGroup>
  );

  // Sizes are dots that grow, named for screen readers and tooltips.
  const sizes = (
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
        <Tooltip key={size} title={sizeLabels[size]}>
          <ToggleButton
            value={size}
            aria-label={sizeLabels[size]}
            sx={{ ...optionSx, width: touch ? TOUCH : 32 }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 6 + size * 5,
                height: 6 + size * 5,
                borderRadius: "50%",
                bgcolor: "currentColor",
              }}
            />
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );

  return (
    <Paper
      elevation={2}
      role="group"
      aria-label={
        settings.tool === "eraser"
          ? t("worlds.maps.eraser.settings", "Eraser settings")
          : t("worlds.maps.brush.settings", "Brush settings")
      }
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        p: 0.75,
        maxWidth: "100%",
      }}
    >
      {settings.tool === "eraser" ? eraserTargets : terrains}
      <Divider orientation="vertical" flexItem />
      {sizes}
    </Paper>
  );
}
