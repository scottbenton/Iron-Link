import { useRollCompleteSpecialTrack } from "@/hooks/useRollCompleteSpecialTrack";
import { capitalize } from "@/lib/capitalize";
import { useSpecialTrackRules } from "@/stores/dataswornTree.store";
import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { Track } from "../../Track";
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
    <Stack gap={4}>
      {tracks.map((trackId) =>
        specialTracks[trackId] ? (
          <Box key={trackId}>
            <Heading mb={1} id={trackId}>
              {specialTracks[trackId].label}
            </Heading>
            <Track
              labelId={trackId}
              value={characterData.specialTracks?.[trackId]?.value ?? 0}
            />
            <Button
              variant={"outline"}
              colorPalette={"gray"}
              mt={2}
              onClick={() => {
                rollTrackProgress(
                  trackId,
                  capitalize(specialTracks[trackId].label),
                  Math.floor(
                    (characterData.specialTracks?.[trackId]?.value ?? 0) / 4,
                  ),
                  moveId,
                );
              }}
            >
              {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
                moveName,
              })}
            </Button>
          </Box>
        ) : null,
      )}
    </Stack>
  );
}
