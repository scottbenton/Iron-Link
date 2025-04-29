import { useRollCompleteProgressTrack } from "@/hooks/useRollCompleteProgressTrack";
import { TrackStatus, TrackTypes } from "@/repositories/tracks.repository";
import { useTracksStore } from "@/stores/tracks.store";
import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { Track } from "../../Track";

export interface ProgressRollsProps {
  trackType: TrackTypes;
  moveId: string;
  moveName: string;
}

export function ProgressRolls(props: ProgressRollsProps) {
  const { trackType, moveId, moveName } = props;

  const { t } = useTranslation();

  const rollTrackProgress = useRollCompleteProgressTrack();

  const tracks = useTracksStore((store) =>
    Object.entries(store.tracks)
      .filter(
        ([, track]) =>
          track.type === trackType && track.status === TrackStatus.Active,
      )
      .sort(
        ([, t1], [, t2]) => t2.createdDate.getTime() - t1.createdDate.getTime(),
      ),
  );

  return (
    <Stack gap={4}>
      {tracks.map(([trackId, track]) => (
        <Box key={trackId}>
          <Heading mb={1} id={trackId}>
            {track.label}
          </Heading>
          <Track value={track.value} labelId={trackId} />
          <Button
            variant={"outline"}
            colorPalette="gray"
            mt={2}
            onClick={() => {
              rollTrackProgress(track.type, track.label, track.value, moveId);
            }}
          >
            {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
              moveName,
            })}
          </Button>
        </Box>
      ))}
    </Stack>
  );
}
