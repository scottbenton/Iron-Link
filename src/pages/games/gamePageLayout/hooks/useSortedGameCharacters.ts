import { useShallow } from "zustand/react/shallow";

import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

export interface SortedGameCharacter {
  id: string;
  name: string;
}

/** The game's characters, yours first, then by name. */
export function useSortedGameCharacters(): SortedGameCharacter[] {
  const uid = useUID();
  return useGameCharactersStore(
    useShallow((store) =>
      Object.entries(store.characters)
        .map(([id, character]) => ({
          id,
          name: character.name,
          uid: character.uid,
        }))
        .sort((a, b) => {
          if (a.uid !== b.uid) {
            if (a.uid === uid) return -1;
            if (b.uid === uid) return 1;
          }
          return a.name.localeCompare(b.name);
        })
        .map(({ id, name }) => ({ id, name })),
    ),
  );
}
