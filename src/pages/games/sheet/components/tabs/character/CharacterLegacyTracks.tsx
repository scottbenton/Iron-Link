import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { useSpecialTrackRules } from "@/stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Heading } from "@chakra-ui/react";
import { useCallback } from "react";

import { DebouncedLegacyTrack } from "./DebouncedLegacyTrack";

export function CharacterLegacyTracks() {
  const t = useGameTranslations();

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
      <Heading size="xl" textTransform="uppercase">
        {t("legacy-tracks-section-heading", "Legacy Tracks")}
      </Heading>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(specialTrackRules).map(([key, specialTrack]) => (
          <Box key={key} display="flex" alignItems="center">
            <DebouncedLegacyTrack
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
