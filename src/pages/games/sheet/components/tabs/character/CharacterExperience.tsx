import { DebouncedConditionMeter } from "@/components/datasworn/ConditonMeter";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Heading } from "@chakra-ui/react";
import { useCallback } from "react";

export function CharacterExperience() {
  const t = useGameTranslations();

  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const unspentExperience = useGameCharacter(
    (character) => character?.unspentExperience ?? 0,
  );
  const updateExperience = useGameCharactersStore(
    (store) => store.updateExperience,
  );

  const handleExperienceChange = useCallback(
    (value: number) => {
      updateExperience(characterId, value).catch(() => {});
    },
    [characterId, updateExperience],
  );

  return (
    <Box>
      <Heading size="xl" textTransform="uppercase">
        {t("experience-section-heading", "Experience")}
      </Heading>
      <Box>
        <DebouncedConditionMeter
          display="inline-flex"
          label={t("unspent-experience", "Unspent Experience")}
          min={0}
          max={100}
          defaultValue={0}
          value={unspentExperience}
          onChange={handleExperienceChange}
          disabled={!isCharacterOwner}
        />
      </Box>
    </Box>
  );
}
