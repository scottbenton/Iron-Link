import { DebouncedClockCircle } from "@/components/datasworn/Clocks/DebouncedClockCircle";
import { useTracksStore } from "@/stores/tracks.store";
import { BoxProps } from "@chakra-ui/react";

interface SceneChallengeClockProps extends Omit<BoxProps, "onClick"> {
  trackId: string;
  segmentsFilled: number;
  label: string;
  canEdit: boolean;
}

export function SceneChallengeClock(props: SceneChallengeClockProps) {
  const { trackId, canEdit, label, segmentsFilled, ...boxProps } = props;

  const updateClockFilledSegments = useTracksStore(
    (store) => store.updateClockFilledSegments,
  );
  const handleSceneChallengeClockChange = (filledSegments: number) => {
    updateClockFilledSegments(trackId, filledSegments).catch(() => {});
  };

  return (
    <DebouncedClockCircle
      size={"small"}
      segments={4}
      value={segmentsFilled}
      voiceLabel={label}
      onFilledSegmentsChange={
        canEdit ? handleSceneChallengeClockChange : undefined
      }
      {...boxProps}
    />
  );
}
