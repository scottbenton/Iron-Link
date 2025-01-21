import { Box, Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useTracksStore } from "stores/tracks.store";

import { TrackStatus, TrackTypes } from "repositories/tracks.repository";

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
    <Stack spacing={2}>
      {tracks.map(([trackId, track]) => (
        <Box key={trackId}>
          <ProgressTrack label={track.label} value={track.value} />
          <Button
            variant={"outlined"}
            color="inherit"
            sx={{ mt: 1 }}
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
