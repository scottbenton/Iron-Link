import { ColorScheme } from "@/repositories/shared.types";
import { Box, BoxProps, Skeleton, Text } from "@chakra-ui/react";
import { CircleUserIcon } from "lucide-react";
import { useState } from "react";

import { AVATAR_SIZES } from "./avatarEnums";

export type AvatarSizes = "small" | "medium" | "large" | "huge";

const variants: { [key in AvatarSizes]: string } = {
  small: "lg",
  medium: "xl",
  large: "2xl",
  huge: "3xl",
};

export interface PortraitAvatarDisplayProps {
  size?: AvatarSizes;

  portraitSettings?: {
    position: {
      x: number;
      y: number;
    };
    scale: number;
  };
  portraitUrl?: string;
  name?: string;
  loading?: boolean;
  borderWidth?: number;
  borderColor?: "follow-theme" | ColorScheme;
}

export function PortraitAvatarDisplay(
  props: PortraitAvatarDisplayProps & Omit<BoxProps, "borderColor">,
) {
  const {
    size = "medium",
    borderColor = "follow-theme",
    borderWidth = 2,
    portraitSettings,
    portraitUrl,
    name,
    loading,
    ...boxProps
  } = props;

  const [isTaller, setIsTaller] = useState<boolean>(true);

  let marginLeft = 0;
  let marginTop = 0;
  if (portraitSettings) {
    marginLeft = portraitSettings.position.x * -100;
    marginTop = portraitSettings.position.y * -100;
  }

  const scale = portraitSettings?.scale ?? 1;

  return (
    <Box
      width={AVATAR_SIZES[size]}
      height={AVATAR_SIZES[size]}
      overflow={"hidden"}
      bg="bg.muted"
      color="fg"
      display={portraitUrl ? "block" : "flex"}
      alignItems="center"
      justifyContent="center"
      borderWidth={borderWidth}
      borderRadius={"sm"}
      borderColor={
        borderColor === "follow-theme" ? "border.emphasized" : "border.subtle"
      }
      css={{
        "&>img": {
          minWidth: isTaller ? `${100 * scale}%` : "auto",
          minHeight: isTaller ? "auto" : `${100 * scale}%`,
          position: "relative",
          transform: `translate(calc(${marginLeft}% + ${
            AVATAR_SIZES[size] / 2
          }px - ${borderWidth}px), calc(${marginTop}% + ${AVATAR_SIZES[size] / 2}px - ${borderWidth}px))`,
        },
        flexShrink: 0,
      }}
      {...boxProps}
    >
      {portraitUrl ? (
        <img
          src={portraitUrl}
          onLoad={(evt) => {
            if (evt.currentTarget.width > evt.currentTarget.height) {
              setIsTaller(false);
            } else {
              setIsTaller(true);
            }
          }}
          alt={"Character Portrait"}
        />
      ) : !loading ? (
        name ? (
          <Text
            fontSize={variants[size]}
            fontWeight={size === "huge" ? 600 : undefined}
          >
            {name[0]}
          </Text>
        ) : (
          <CircleUserIcon />
        )
      ) : (
        <Skeleton />
      )}
    </Box>
  );
}
