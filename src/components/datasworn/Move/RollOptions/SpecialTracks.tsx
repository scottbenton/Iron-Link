import { Box, Button, Stack, Typography, capitalize } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { useRollCompleteSpecialTrack } from "pages/games/hooks/useRollCompleteSpecialTrack";

import { MAX_PROGRESS_SCORE } from "lib/progressTrack.lib";

import { useSpecialTrackRules } from "stores/dataswornTree.store";

import { CharacterRollOptionState } from "./common.types";

export interface SpecialTracksProps {
  moveId: string;
  moveName: string;
  tracks: string[];
  characterData: CharacterRollOptionState;
}

export function SpecialTracks(props: SpecialTracksProps) {
  const { moveId, moveName, tracks, characterData } = props;

  const { t } = useTranslation();

  const specialTracks = useSpecialTrackRules();

  const rollTrackProgress = useRollCompleteSpecialTrack();

  if (tracks.length === 0) return null;

  return (
    <Stack spacing={2}>
      {tracks.map((trackId) => {
        const track = characterData.specialTracks?.[trackId] ?? { value: 0 };
        return (
          <Box key={trackId}>
            <ProgressTrack
              label={specialTracks[trackId].label}
              value={track.value}
            />
            {track.isLegacy && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {t(
                  "datasworn.move.legacy-track-complete",
                  "Legacy complete: rolls use a progress score of {{score}}",
                  { score: MAX_PROGRESS_SCORE },
                )}
              </Typography>
            )}
            <Button
              variant={"outlined"}
              color="inherit"
              sx={{ mt: 1 }}
              onClick={() => {
                rollTrackProgress(
                  trackId,
                  capitalize(specialTracks[trackId].label),
                  track,
                  moveId,
                );
              }}
            >
              {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
                moveName,
              })}
            </Button>
          </Box>
        );
      })}
    </Stack>
  );
}
