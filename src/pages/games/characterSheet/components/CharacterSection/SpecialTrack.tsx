import { useCallback } from "react";

import { ProgressTrack } from "ui/game/ProgressTrack";
import { capitalize } from "ui/game/shared";

import { useDebouncedSync } from "hooks/useDebouncedSync";

interface SpecialTrackProps {
  trackKey: string;
  label: string;
  legacy: boolean;
  ticks: number;
  /** Saves a change. Without it the track is read-only. */
  onChange?: (key: string, ticks: number) => void;
}

// One special track, saved after a pause so several marks are one save.
export function SpecialTrack(props: SpecialTrackProps) {
  const { trackKey, label, legacy, ticks, onChange } = props;

  const persist = useCallback(
    (next: number) => onChange?.(trackKey, next),
    [trackKey, onChange],
  );
  const [value, setValue] = useDebouncedSync(persist, ticks);

  return (
    <ProgressTrack
      label={capitalize(label)}
      ticks={value}
      legacy={legacy}
      onChange={onChange ? setValue : undefined}
    />
  );
}
