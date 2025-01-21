import { Box, Typography } from "@mui/material";

import { PortraitAvatar } from "components/characters/PortraitAvatar";
import { InitiativeStatusChip } from "components/datasworn/InitiativeStatusChip";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import {
  CharacterPermissionType,
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { InitiativeStatus } from "repositories/character.repository";

import { useCharacterId } from "../../hooks/useCharacterId";

export function CharacterDetails() {
  const characterId = useCharacterId();
  const isCharacterOwner =
    useGamePermissions().characterPermission === CharacterPermissionType.Owner;

  const name = useGameCharacter((character) => character?.name ?? "");
  const initiativeStatus = useGameCharacter(
    (character) => character?.initiativeStatus,
  );
  const portraitSettings = useGameCharacter(
    (character) => character?.profileImage,
  );

  const updateInitiativeStatus = useGameCharactersStore(
    (store) => store.updateCharacterInitiativeStatus,
  );

  return (
    <Box display="flex" gap={2}>
      {portraitSettings && (
        <PortraitAvatar
          characterId={characterId ?? ""}
          name={name}
          size={"large"}
          portraitSettings={portraitSettings ?? undefined}
        />
      )}
      <Box>
        <Typography variant="h4" fontFamily={"fontFamilyTitle"}>
          {name}
        </Typography>
        <InitiativeStatusChip
          status={initiativeStatus ?? InitiativeStatus.OutOfCombat}
          handleStatusChange={
            isCharacterOwner
              ? (status) => {
                  if (characterId) {
                    updateInitiativeStatus(characterId, status).catch(() => {});
                  }
                }
              : undefined
          }
        />
      </Box>
    </Box>
  );
}
