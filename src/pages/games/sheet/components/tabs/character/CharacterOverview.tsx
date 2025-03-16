import { PortraitAvatar } from "@/components/common/PortraitAvatar";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { InitiativeStatus } from "@/repositories/character.repository";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Heading, Tag } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";

import { useInitiativeStatusText } from "./useInitiativeStatusText";

export function CharacterOverview() {
  const name = useGameCharacter((character) => character?.name ?? "");
  const portraitSettings = useGameCharacter(
    (character) => character?.profileImage,
  );
  const initiativeStatus = useGameCharacter(
    (character) => character?.initiativeStatus ?? InitiativeStatus.OutOfCombat,
  );
  const characterId = useCharacterId();

  const setInitiativeStatus = useGameCharactersStore(
    (store) => store.updateCharacterInitiativeStatus,
  );

  const initiativeStatusText = useInitiativeStatusText();

  const canEdit = useIsOwnerOfCharacter();

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <PortraitAvatar
        characterId={characterId}
        name={name}
        portraitSettings={portraitSettings ?? undefined}
        size="large"
      />
      <Box>
        <Heading size="3xl" mb={1}>
          {name}
        </Heading>
        {canEdit ? (
          <MenuRoot
            onSelect={({ value }) =>
              setInitiativeStatus(characterId, value as InitiativeStatus)
            }
          >
            <MenuTrigger asChild>
              <Tag.Root
                variant="subtle"
                as="button"
                cursor="pointer"
                size="lg"
                mb={2}
              >
                <Tag.Label>{initiativeStatusText[initiativeStatus]}</Tag.Label>
                <Tag.EndElement>
                  <ChevronDown />
                </Tag.EndElement>
              </Tag.Root>
            </MenuTrigger>
            <MenuContent>
              <MenuItem value={InitiativeStatus.HasInitiative}>
                {initiativeStatusText[InitiativeStatus.HasInitiative]}
              </MenuItem>
              <MenuItem value={InitiativeStatus.DoesNotHaveInitiative}>
                {initiativeStatusText[InitiativeStatus.DoesNotHaveInitiative]}
              </MenuItem>
              <MenuItem value={InitiativeStatus.OutOfCombat}>
                {initiativeStatusText[InitiativeStatus.OutOfCombat]}
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        ) : (
          <Tag.Root variant="subtle" size="lg" mb={2}>
            <Tag.Label>{initiativeStatusText[initiativeStatus]}</Tag.Label>
          </Tag.Root>
        )}
      </Box>
    </Box>
  );
}
