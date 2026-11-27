import { CharacterInitiativeChip } from "components/characters/CharacterInitiativeChip";
import { CharacterPortraitAvatar } from "components/characters/CharacterPortraitAvatar";

import { Text } from "ui/components/Text";
import { Flex, HStack, Stack } from "ui/primitives";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";
import { CharacterAccessChip } from "./CharacterAccessChip";

export function CharacterDetails() {
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const name = useGameCharacter((character) => character?.name ?? "");
  const initiativeStatus = useGameCharacter(
    (character) => character?.initiativeStatus,
  );
  const portraitSettings = useGameCharacter(
    (character) => character?.profileImage,
  );
  const colorScheme = useGameCharacter((character) => character?.colorScheme);

  const updateInitiativeStatus = useGameCharactersStore(
    (store) => store.updateCharacterInitiativeStatus,
  );

  return (
    <HStack gap="3" alignItems="center">
      {portraitSettings && characterId && (
        <CharacterPortraitAvatar
          characterId={characterId}
          name={name}
          portraitSettings={portraitSettings}
          colorScheme={colorScheme}
          size="lg"
          shape="rounded"
          decorative
        />
      )}
      <Stack gap="1" minWidth="0" alignItems="start">
        <Text variant="h3" as="h3">
          {name}
        </Text>
        <Flex gap="2" flexWrap="wrap" alignItems="center">
          <CharacterInitiativeChip
            status={initiativeStatus}
            onStatusChange={
              canEditCharacter && characterId
                ? (status) => updateInitiativeStatus(characterId, status)
                : undefined
            }
          />
          <CharacterAccessChip />
        </Flex>
      </Stack>
    </HStack>
  );
}
