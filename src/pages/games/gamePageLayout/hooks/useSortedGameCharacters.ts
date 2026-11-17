import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { ICharacter } from "services/character.service";

export interface SortedGameCharacter {
  id: string;
  name: string;
  uid: string;
  profileImage: ICharacter["profileImage"];
}

// The game's characters, the signed in player's first, then by name. The
// game's tabs and the phone's character switcher list them in this order.
export function useSortedGameCharacters(): SortedGameCharacter[] {
  const uid = useUID();

  return useGameCharactersStore((store) => {
    return Object.entries(store.characters)
      .map(([key, value]) => {
        return {
          id: key,
          name: value.name,
          uid: value.uid,
          profileImage: value.profileImage,
        };
      })
      .sort((a, b) => {
        if (a.uid !== b.uid) {
          if (a.uid === uid) return -1;
          if (b.uid === uid) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  });
}
