import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { WorldMapGrid } from "lib/worldMap/grid";

import {
  WORLD_MAP_GRIDS,
  getGridDescription,
  getGridLabel,
} from "./worldMapGrids";

export function WorldMapGridPicker({
  value,
  onChange,
  disabled,
}: {
  value: WorldMapGrid;
  onChange: (grid: WorldMapGrid) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <FormControl disabled={disabled}>
      <FormLabel id={labelId}>{t("worlds.maps.grid", "Grid")}</FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onChange={(event) => onChange(event.target.value as WorldMapGrid)}
      >
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          {WORLD_MAP_GRIDS.map((grid) => (
            <FormControlLabel
              key={grid}
              value={grid}
              control={<Radio />}
              sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 0.5 } }}
              label={
                <>
                  <Typography>{getGridLabel(t, grid)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getGridDescription(t, grid)}
                  </Typography>
                </>
              }
            />
          ))}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}
