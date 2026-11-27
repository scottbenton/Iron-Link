import { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getDefaultClockStrings } from "ui/game/Clock/clockStrings";
import { advanceClock } from "ui/game/Clock/clockValue";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useSetAnnouncement } from "stores/appState.store";

import { ClockCircle, ClockSize } from "./ClockCircle";

export interface DebouncedClockCircleProps {
  segments: number;
  value: number;
  onFilledSegmentsChange?: (value: number) => void;
  size?: ClockSize;
  voiceLabel: string;
  sx?: SxProps<Theme>;
}

export function DebouncedClockCircle(props: DebouncedClockCircleProps) {
  const { segments, value, onFilledSegmentsChange, size, voiceLabel, sx } =
    props;

  const [localFilledSegments, setLocalFilledSegments] = useDebouncedSync(
    onFilledSegmentsChange,
    value,
  );

  const { t } = useTranslation();
  const announce = useSetAnnouncement();

  // Announced outside the state updater, which Strict Mode runs twice. A
  // full clock clears (changes.md row 35 proposes the library's stop).
  const handleIncrement = () => {
    const newValue = advanceClock(localFilledSegments, segments) ?? 0;
    setLocalFilledSegments(newValue);
    const strings = getDefaultClockStrings(t);
    announce(
      newValue === 0
        ? t(
            "datasworn.clock.cleared-announcement",
            "Cleared {{label}}, {{valueText}}",
            {
              label: voiceLabel,
              valueText: strings.valueText(0, segments),
            },
          )
        : strings.changed(voiceLabel, strings.valueText(newValue, segments)),
    );
  };

  return (
    <ClockCircle
      segments={segments}
      value={localFilledSegments}
      label={voiceLabel}
      size={size}
      onClick={onFilledSegmentsChange ? handleIncrement : undefined}
      sx={sx}
    />
  );
}
