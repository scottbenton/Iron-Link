import { Box, Typography } from "@mui/material";

import { PortraitAvatar } from "components/characters/PortraitAvatar";
import { InitiativeStatusChip } from "components/datasworn/InitiativeStatusChip";

import { useIsMobile } from "hooks/useIsMobile";

import { useGameCharacter } from "stores/gameCharacters.store";

import { useCharacterId } from "../../hooks/useCharacterId";
import { CharacterAccessChip } from "./CharacterAccessChip";
import { useCharacterInitiativeStatus } from "./useCharacterInitiativeStatus";

export function CharacterDetails() {
  const characterId = useCharacterId();
  // Phones show initiative as a segmented control at the top of the
  // Overview tab instead (InitiativeSection).
  const isMobile = useIsMobile();

  const name = useGameCharacter((character) => character?.name ?? "");
  const initiative = useCharacterInitiativeStatus();
  const portraitSettings = useGameCharacter(
    (character) => character?.profileImage,
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
        <Typography variant="h4" component="h3" fontFamily={"fontFamilyTitle"}>
          {name}
        </Typography>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1}>
          {!isMobile && (
            <InitiativeStatusChip
              status={initiative.status}
              handleStatusChange={initiative.handleStatusChange}
            />
          )}
          <CharacterAccessChip />
        </Box>
      </Box>
    </Box>
  );
}
