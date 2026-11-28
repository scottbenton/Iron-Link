import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { XPMeter } from "ui/game/ConditionMeter";
import { SectionHeading } from "ui/layout";
import { Flex, Stack } from "ui/primitives";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";

export function ExperienceSection() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const unspentExperience = useGameCharacter(
    (character) => character?.unspentExperience ?? 0,
  );
  const updateExperience = useGameCharactersStore(
    (store) => store.updateExperience,
  );

  const persist = useCallback(
    (value: number) => {
      updateExperience(characterId, value).catch(() => {});
    },
    [characterId, updateExperience],
  );
  const [value, setValue] = useDebouncedSync(persist, unspentExperience);

  return (
    <Stack gap="2" as="section">
      <SectionHeading
        title={t("character.character-sidebar.experience", "Experience")}
        as="h3"
      />
      {/* At its own width, like the meters, not across the column. */}
      <Flex>
        <XPMeter
          label={t(
            "character.character-sidebar.unspent-experience",
            "Unspent Experience",
          )}
          value={value}
          onChange={canEditCharacter ? setValue : undefined}
        />
      </Flex>
    </Stack>
  );
}
