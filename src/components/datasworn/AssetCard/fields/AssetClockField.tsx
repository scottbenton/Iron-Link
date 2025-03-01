import { Box, Heading } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";

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
      <Heading size="md" color={"fg.muted"}>
        {field.label}
      </Heading>

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
