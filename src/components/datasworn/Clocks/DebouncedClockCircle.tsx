import { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";

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

  // Announced outside the state updater, which Strict Mode runs twice.
  const handleIncrement = () => {
    const newValue =
      localFilledSegments >= segments ? 0 : localFilledSegments + 1;
    setLocalFilledSegments(newValue);
    announce(
      newValue === 0
        ? t(
            "datasworn.clock.cleared-announcement",
            "Cleared {{label}}, 0 of {{segments}} segments filled",
            { label: voiceLabel, segments },
          )
        : t(
            "datasworn.clock.filled-announcement",
            "{{label}}, {{value}} of {{segments}} segments filled",
            { label: voiceLabel, value: newValue, segments },
          ),
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
