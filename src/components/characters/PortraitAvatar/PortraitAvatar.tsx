import { SxProps, Theme } from "@mui/material";

import {
  AvatarSizes,
  PortraitAvatarDisplay,
} from "components/characters/PortraitAvatar/PortraitAvatarDisplay";

import {
  useCharacterPortrait,
  useLoadCharacterPortrait,
} from "stores/character.store";

import { ColorScheme } from "repositories/shared.types";

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
  borderColor?: "folow-theme" | ColorScheme;
  borderWidth?: number;
  rounded?: boolean;
  sx?: SxProps<Theme>;
}

export function PortraitAvatar(props: PortraitAvatarProps) {
  const {
    characterId,
    name,
    portraitSettings,
    size,
    rounded,
    borderColor,
    borderWidth,
    sx,
  } = props;

  const filename = portraitSettings?.filename;
  useLoadCharacterPortrait(characterId, filename);
  const portraitUrl = useCharacterPortrait(characterId).url;

  return (
    <PortraitAvatarDisplay
      size={size}
      rounded={rounded}
      portraitSettings={portraitSettings}
      portraitUrl={portraitUrl}
      name={name}
      loading={!name}
      borderWidth={borderWidth}
      borderColor={borderColor}
      sx={sx}
    />
  );
}
