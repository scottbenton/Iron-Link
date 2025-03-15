import { Track } from "@/components/datasworn/Track";
import { TrackProgressButtons } from "@/components/datasworn/Track/TrackProgressButtons";
import { useDebouncedSync } from "@/hooks/useDebouncedSync";
import { Difficulty } from "@/repositories/tracks.repository";
import { Box, Heading } from "@chakra-ui/react";
import { useCallback } from "react";

export interface DebouncedLegacyTrackProps {
  progressTrackKey: string;
  label: string;
  value: number;
  onChange?: (progressTrackKey: string, value: number) => void;
}

export function DebouncedLegacyTrack(props: DebouncedLegacyTrackProps) {
  const {
    progressTrackKey,
    label,

    onChange,
  } = props;

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
    <Box>
      <Box display="flex" alignItems="center" justifyContent={"space-between"}>
        <Heading size="md" textTransform={"capitalize"}>
          {label}
        </Heading>
        {onChange && (
          <TrackProgressButtons
            variant="ghost"
            setValue={setValue}
            difficulty={Difficulty.Epic}
          />
        )}
      </Box>
      <Track value={value} labelId={progressTrackKey} />
    </Box>
  );
}
