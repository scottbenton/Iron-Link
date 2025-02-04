import { Box, Typography } from "@mui/material";
import { useCallback } from "react";

import { DebouncedProgressTrack } from "components/datasworn/ProgressTrack";

import { useSpecialTrackRules } from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCharacterId } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";

export function LegacyTracks() {
  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const legacyTracks = useGameCharacter(
    (character) => character?.specialTracks ?? {},
  );
  const specialTrackRules = useSpecialTrackRules();
  const updateSpecialTrackValue = useGameCharactersStore(
    (store) => store.updateSpecialTrackValue,
  );

  const handleProgressTrackChange = useCallback(
    (key: string, value: number) => {
      if (characterId) {
        updateSpecialTrackValue(characterId, key, value).catch(() => {});
      }
    },
    [characterId, updateSpecialTrackValue],
  );

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        Legacy Tracks
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {Object.entries(specialTrackRules).map(([key, specialTrack]) => (
          <Box key={key} display="flex" alignItems="center">
            <DebouncedProgressTrack
              progressTrackKey={key}
              label={specialTrack.label}
              value={legacyTracks[key]?.value ?? 0}
              onChange={
                isCharacterOwner ? handleProgressTrackChange : undefined
              }
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
