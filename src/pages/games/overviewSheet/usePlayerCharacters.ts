import { useShallow } from "zustand/react/shallow";

import { uiSchemeNames } from "providers/ThemeProvider/uiSchemeNames";

import type { PortraitGroupMember } from "ui/game/PortraitGroup";

import { useCharacterStore } from "stores/character.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

/**
 * One player's characters in the game, as the player card's portraits. The
 * portraits are the ones the character cards above have loaded.
 */
export function usePlayerCharacters(uid: string): PortraitGroupMember[] {
  const characters = useGameCharactersStore(
    useShallow((store) =>
      Object.values(store.characters).filter(
        (character) => character.uid === uid,
      ),
    ),
  );
  const portraitUrls = useCharacterStore(
    useShallow((store) =>
      characters.map((character) =>
        character.profileImage ? store.portraits[character.id]?.url : undefined,
      ),
    ),
  );

  return characters.map((character, index) => ({
    id: character.id,
    name: character.name,
    portraitUrl: portraitUrls[index],
    crop: character.profileImage
      ? {
          position: character.profileImage.position,
          scale: character.profileImage.scale,
        }
      : undefined,
    colorScheme: character.colorScheme
      ? uiSchemeNames[character.colorScheme]
      : undefined,
  }));
}
