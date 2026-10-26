import { useCharacterAccess } from "stores/gameCharacters.store";

import { useCharacterIdOptional } from "./useCharacterId";

// Whether the current user may edit the open character sheet: its owner, or
// anyone the owner has shared it with.
export function useCanEditCharacter() {
  return useCharacterAccess(useCharacterIdOptional()).canEdit;
}
