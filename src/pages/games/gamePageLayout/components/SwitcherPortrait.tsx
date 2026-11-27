import { uiSchemeNames } from "providers/ThemeProvider/uiSchemeNames";

import { CharacterPortrait } from "ui/game/CharacterPortrait";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

/**
 * A character's 24px portrait for the phone's character switcher: their
 * picture, or their initials, ringed in their colour scheme.
 */
export function SwitcherPortrait(props: { characterId: string }) {
  const { characterId } = props;
  const character = useGameCharactersStore(
    (store) => store.characters[characterId],
  );
  const filename = character?.profileImage?.filename;
  useLoadCharacterPortrait(characterId, filename);
  const portraitUrl = useCharacterPortrait(characterId).url;

  if (!character) return null;
  return (
    <CharacterPortrait
      name={character.name}
      portraitUrl={filename ? portraitUrl : undefined}
      crop={character.profileImage ?? undefined}
      colorScheme={
        character.colorScheme ? uiSchemeNames[character.colorScheme] : undefined
      }
      size="xs"
      decorative
    />
  );
}
