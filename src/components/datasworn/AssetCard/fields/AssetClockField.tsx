import { Datasworn } from "@datasworn-community/core";
import { Box, Typography } from "@mui/material";

import { DebouncedClockCircle } from "../../Clocks/DebouncedClockCircle";

export interface AssetClockFieldProps {
  value?: number;
  field: Datasworn.ClockField;
  onChange?: (value: number) => void;
}

export function AssetClockField(props: AssetClockFieldProps) {
  const { value, field, onChange } = props;

  return (
    <Box>
      <Typography
        variant={"subtitle1"}
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        color={"textSecondary"}
      >
        {field.label}
      </Typography>

      <DebouncedClockCircle
        value={value ?? 0}
        segments={field.max}
        onFilledSegmentsChange={onChange}
        voiceLabel={field.label}
        size={"small"}
      />
    </Box>
  );
}
