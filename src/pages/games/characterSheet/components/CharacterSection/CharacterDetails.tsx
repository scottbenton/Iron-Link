import { Box, Typography } from "@mui/material";

import { PortraitAvatar } from "components/characters/PortraitAvatar";
import { InitiativeStatusChip } from "components/datasworn/InitiativeStatusChip";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { InitiativeStatus } from "repositories/character.repository";

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
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
          <InitiativeStatusChip
            status={initiativeStatus ?? InitiativeStatus.OutOfCombat}
            handleStatusChange={
              canEditCharacter
                ? (status) => {
                    if (characterId) {
                      updateInitiativeStatus(characterId, status).catch(
                        () => {},
                      );
                    }
                  }
                : undefined
            }
          />
          <CharacterAccessChip />
        </Box>
      </Box>
    </Box>
  );
}
