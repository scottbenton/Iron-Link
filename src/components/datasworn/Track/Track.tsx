import { TrackTick } from "@/components/datasworn/Track/TrackTick";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { Box, BoxProps } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";

export interface TrackProps extends BoxProps {
  value: number;
  labelId: string;
}

export function Track(props: TrackProps) {
  const { value, labelId, ...boxProps } = props;

  const t = useGameTranslations();

  const checks = useMemo(() => {
    const checks: number[] = [];

    let checksIndex = 0;
    let checksValue = 0;

    for (let i = 0; i <= 40; i++) {
      if (i % 4 === 0 && i !== 0) {
        checks[checksIndex] = checksValue;
        checksIndex++;
        checksValue = 0;
      }

      if (i < value) {
        checksValue++;
      }
    }

    return checks;
  }, [value]);

  const getValueText = useCallback(() => {
    return t(
      "datasworn.progress-track.value-text",
      "{{value}} ticks: {{fullBoxes}} boxes fully filled",
      {
        value,
        fullBoxes: Math.floor(value / 4),
      },
    );
  }, [value, t]);

  return (
    <Box
      display={"flex"}
      bg="bg.panel"
      color="fg.subtle"
      borderRadius="sm"
      borderWidth={1}
      borderColor={"border.emphasized"}
      role={"meter"}
      aria-labelledby={labelId}
      aria-valuemin={0}
      aria-valuemax={40}
      aria-valuenow={value}
      aria-valuetext={getValueText()}
      alignSelf={"flex-start"}
      {...boxProps}
    >
      {checks.map((value, index) => (
        <TrackTick
          value={value}
          key={index}
          borderLeftWidth={1}
          size={7}
          _first={{
            borderLeftWidth: 0,
            borderLeftRadius: "inherit",
          }}
          _last={{
            borderRightRadius: "inherit",
          }}
        />
      ))}
    </Box>
  );
}
