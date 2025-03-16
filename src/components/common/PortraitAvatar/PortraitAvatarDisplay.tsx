import { LocalThemeProvider } from "@/providers/ThemeProvider";
import { ColorScheme } from "@/repositories/shared.types";
import { Box, BoxProps, Skeleton, Text } from "@chakra-ui/react";
import { CircleUserIcon } from "lucide-react";
import { PropsWithChildren, useState } from "react";

import { AVATAR_SIZES, AvatarSizes } from "./avatarEnums";

const fontVariants: Record<AvatarSizes, string> = {
  small: "lg",
  medium: "xl",
  large: "3xl",
  huge: "6xl",
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
    borderColor,
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

  const Wrapper = ({ children }: PropsWithChildren) =>
    borderColor && borderColor !== "follow-theme" ? (
      <LocalThemeProvider colorScheme={borderColor}>
        {children}
      </LocalThemeProvider>
    ) : (
      <>{children}</>
    );

  return (
    <Wrapper>
      <Box
        width={AVATAR_SIZES[size] + "px"}
        height={AVATAR_SIZES[size] + "px"}
        overflow={"hidden"}
        bg="bg.muted"
        color="fg"
        display={portraitUrl ? "block" : "flex"}
        alignItems="center"
        justifyContent="center"
        borderWidth={borderWidth}
        borderRadius={"sm"}
        colorPalette={!borderColor ? "gray" : "current"}
        borderColor={borderColor ? "colorPalette.500" : "border"}
        css={{
          "&>img": {
            maxW: isTaller ? `${100 * scale}%` : "10000vh",
            maxH: isTaller ? "10000vh" : `${100 * scale}%`,
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
              console.debug(evt);
              console.debug(
                evt.currentTarget.naturalWidth,
                evt.currentTarget.naturalHeight,
              );
              if (
                evt.currentTarget.naturalWidth > evt.currentTarget.naturalHeight
              ) {
                console.debug("SEETING IS TALLER TO FALSE");
                setIsTaller(false);
              } else {
                console.debug("SEETING IS TALLER TO TRUE");
                setIsTaller(true);
              }
            }}
          />
        ) : !loading ? (
          name ? (
            <Text
              fontSize={fontVariants[size]}
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
    </Wrapper>
  );
}
