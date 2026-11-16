import { useMemo } from "react";

import { useUID } from "stores/auth.store";
import { getCharacterAccess } from "stores/characterAccess";
import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

export interface WorldBondCharacter {
  id: string;
  name: string;
  canEdit: boolean;
}

// The current game's characters, by name, and whether this person may change
// each one's bonds (the same rule as editing the sheet).
export function useWorldBondCharacters(): WorldBondCharacter[] {
  const uid = useUID();
  const gamePermission = useGameStore((store) => store.gamePermissions);
  const characters = useGameCharactersStore((store) => store.characters);
  return useMemo(
    () =>
      Object.entries(characters)
        .map(([id, character]) => ({
          id,
          name: character.name,
          canEdit: getCharacterAccess({
            uid,
            ownerId: character.uid,
            editPermissions: character.editPermissions,
            gamePermission,
          }).canEdit,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [characters, uid, gamePermission],
  );
}
