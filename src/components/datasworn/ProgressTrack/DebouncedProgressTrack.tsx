import { useCallback } from "react";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { ProgressTrack, ProgressTrackProps } from "./ProgressTrack";

export interface DebouncedProgressTrackProps
  extends Omit<ProgressTrackProps, "onChange"> {
  progressTrackKey: string;
  onChange?: (progressTrackKey: string, newValue: number) => void;
}

export function DebouncedProgressTrack(props: DebouncedProgressTrackProps) {
  const { onChange, progressTrackKey, ...progressTrackProps } = props;

  const handleProgressTrackChange = useCallback(
    (value: number) => {
      onChange?.(progressTrackKey, value);
    },
    [onChange, progressTrackKey],
  );

  const [value, setValue] = useDebouncedSync(
    handleProgressTrackChange,
    props.value,
  );

  return (
    <ProgressTrack
      {...progressTrackProps}
      value={value}
      onChange={onChange ? setValue : undefined}
    />
  );
}
