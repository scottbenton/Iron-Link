import { uiSchemeNames } from "providers/ThemeProvider/uiSchemeNames";

import { CharacterPortrait, PortraitSize } from "ui/game/CharacterPortrait";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";

import { ColorScheme } from "repositories/shared.types";

import { ICharacter } from "services/character.service";

export interface CharacterPortraitAvatarProps {
  characterId: string;
  name: string;
  portraitSettings?: ICharacter["profileImage"];
  /** Rings the portrait in a colour scheme. */
  colorScheme?: ColorScheme | null;
  size?: PortraitSize;
  shape?: "circle" | "rounded";
  /** Hides the portrait from screen readers, where the name is beside it. */
  decorative?: boolean;
}

// A character's portrait, loaded from storage, on the library's
// CharacterPortrait. Shows initials until the image arrives, or without one.
export function CharacterPortraitAvatar(props: CharacterPortraitAvatarProps) {
  const {
    characterId,
    name,
    portraitSettings,
    colorScheme,
    size,
    shape,
    decorative,
  } = props;

  useLoadCharacterPortrait(characterId, portraitSettings?.filename);
  const portraitUrl = useCharacterPortrait(characterId).url;

  return (
    <CharacterPortrait
      name={name}
      portraitUrl={portraitSettings ? portraitUrl : undefined}
      crop={
        portraitSettings
          ? {
              position: portraitSettings.position,
              scale: portraitSettings.scale,
            }
          : undefined
      }
      colorScheme={colorScheme ? uiSchemeNames[colorScheme] : undefined}
      size={size}
      shape={shape}
      decorative={decorative}
    />
  );
}
