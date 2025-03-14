import { ColorScheme } from "@/repositories/shared.types";
import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "@/stores/character.store";
import { BoxProps } from "@chakra-ui/react";

import { PortraitAvatarDisplay } from "./PortraitAvatarDisplay";
import { AvatarSizes } from "./avatarEnums";

export interface PortraitAvatarProps {
  characterId: string;
  name?: string;
  portraitSettings?: {
    filename: string;
    position: {
      x: number;
      y: number;
    };
    scale: number;
  };
  size?: AvatarSizes;
  borderColor?: "follow-theme" | ColorScheme;
  borderWidth?: number;
}

export function PortraitAvatar(
  props: PortraitAvatarProps & Omit<BoxProps, "borderColor">,
) {
  const {
    characterId,
    name,
    portraitSettings,
    size,
    borderColor,
    borderWidth,
    ...boxProps
  } = props;

  const filename = portraitSettings?.filename;
  useLoadCharacterPortrait(characterId, filename);
  const portraitUrl = useCharacterPortrait(characterId).url;

  return (
    <PortraitAvatarDisplay
      size={size}
      portraitSettings={portraitSettings}
      portraitUrl={portraitUrl}
      name={name}
      loading={!name}
      borderWidth={borderWidth}
      borderColor={borderColor}
      {...boxProps}
    />
  );
}
