import { useCharacterAccess } from "stores/gameCharacters.store";

import { useCharacterIdOptional } from "./useCharacterId";

// Only for controls that stay with the owner (Edit access, Delete). Sheet
// edits use useCanEditCharacter.
export function useIsOwnerOfCharacter() {
  return useCharacterAccess(useCharacterIdOptional()).isOwner;
}
