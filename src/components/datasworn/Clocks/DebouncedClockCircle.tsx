import { useDebouncedSync } from "@/hooks/useDebouncedSync";
import { useSetAnnouncement } from "@/stores/appState.store";
import { BoxProps } from "@chakra-ui/react";

import { ClockCircle, ClockSize } from "./ClockCircle";

export interface DebouncedClockCircleProps extends Omit<BoxProps, "onClick"> {
  segments: number;
  value: number;
  onFilledSegmentsChange?: (value: number) => void;
  size?: ClockSize;
  voiceLabel: string;
}

export function DebouncedClockCircle(props: DebouncedClockCircleProps) {
  const {
    segments,
    value,
    onFilledSegmentsChange,
    size,
    voiceLabel,
    ...boxProps
  } = props;

  const [localFilledSegments, setLocalFilledSegments] = useDebouncedSync(
    onFilledSegmentsChange,
    value,
  );

  const announce = useSetAnnouncement();

  const handleIncrement = () => {
    setLocalFilledSegments((prev) => {
      const newValue = prev + 1;
      if (segments < newValue) {
        announce(
          `Cannot increase clock ${voiceLabel} beyond ${segments}. Resetting field to 0`,
        );
        return 0;
      }
      announce(
        `Increased clock ${voiceLabel} by 1 for a total of ${newValue} of ${segments} segments.`,
      );
      return newValue;
    });
  };

  return (
    <ClockCircle
      segments={segments}
      value={localFilledSegments}
      size={size}
      onClick={onFilledSegmentsChange ? handleIncrement : undefined}
      {...boxProps}
    />
  );
}
