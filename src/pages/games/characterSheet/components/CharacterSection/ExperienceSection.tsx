import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedConditionMeter } from "components/datasworn/ConditonMeter";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCharacterId } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";

export function ExperienceSection() {
  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const unspentExperience = useGameCharacter(
    (character) => character?.unspentExperience ?? 0,
  );
  const updateExperience = useGameCharactersStore(
    (store) => store.updateExperience,
  );

  const { t } = useTranslation();

  const handleExperienceChange = useCallback(
    (value: number) => {
      updateExperience(characterId, value).catch(() => {});
    },
    [characterId, updateExperience],
  );

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {t("character.character-sidebar.experience", "Experience")}
      </Typography>
      <DebouncedConditionMeter
        label={t(
          "character.character-sidebar.unspent-experience",
          "Unspent Experience",
        )}
        min={0}
        max={100}
        defaultValue={0}
        value={unspentExperience}
        onChange={handleExperienceChange}
        disabled={!isCharacterOwner}
      />
    </Box>
  );
}
