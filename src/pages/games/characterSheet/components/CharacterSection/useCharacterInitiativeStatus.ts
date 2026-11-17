import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { InitiativeStatus } from "repositories/character.repository";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";

/**
 * The open character's initiative status, and a setter for those who may
 * edit the character (undefined otherwise), for the header chip and the phone
 * sheet's segmented control alike.
 */
export function useCharacterInitiativeStatus(): {
  status: InitiativeStatus;
  handleStatusChange?: (status: InitiativeStatus) => void;
} {
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const status = useGameCharacter(
    (character) => character?.initiativeStatus ?? InitiativeStatus.OutOfCombat,
  );
  const updateInitiativeStatus = useGameCharactersStore(
    (store) => store.updateCharacterInitiativeStatus,
  );

  return {
    status,
    handleStatusChange: canEditCharacter
      ? (newStatus) => {
          if (characterId) {
            updateInitiativeStatus(characterId, newStatus).catch(() => {});
          }
        }
      : undefined,
  };
}
