import { Paper, Slider, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

// Background sizes run from a sixteenth to sixteen times the image's own
// width, on a log scale so each step feels the same.
const SIZE_RANGE = 4;

// Over the map, top left, while the background tool is in hand: the image's
// size. Dragging the map moves it.
export function WorldMapBackgroundSize({
  width,
  naturalWidth,
  onResize,
  touch = false,
}: {
  width: number;
  naturalWidth: number;
  onResize: (width: number, commit: boolean) => void;
  touch?: boolean;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const percent = (value: number) => `${Math.round(2 ** value * 100)}%`;
  return (
    <Paper
      elevation={2}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        minHeight: touch ? 44 : 36,
        width: 280,
        maxWidth: "100%",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        id={labelId}
        noWrap
        sx={{ flexShrink: 0 }}
      >
        {t("worlds.maps.background.size", "Image size")}
      </Typography>
      <Slider
        size="small"
        aria-labelledby={labelId}
        min={-SIZE_RANGE}
        max={SIZE_RANGE}
        step={0.05}
        value={Math.log2(width / naturalWidth)}
        valueLabelDisplay="auto"
        valueLabelFormat={percent}
        getAriaValueText={percent}
        onChange={(_, value) =>
          onResize(naturalWidth * 2 ** (value as number), false)
        }
        onChangeCommitted={(_, value) =>
          onResize(naturalWidth * 2 ** (value as number), true)
        }
      />
    </Paper>
  );
}
