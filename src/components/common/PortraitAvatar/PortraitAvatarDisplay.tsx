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
  size?: AvatarSizes | number;

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

  const sizePx = typeof size === "number" ? size : AVATAR_SIZES[size];

  return (
    <Wrapper>
      <Box
        width={`${sizePx}px`}
        height={`${sizePx}px`}
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
              sizePx / 2
            }px - ${borderWidth}px), calc(${marginTop}% + ${sizePx / 2}px - ${borderWidth}px))`,
          },
          flexShrink: 0,
        }}
        {...boxProps}
      >
        {portraitUrl ? (
          <img
            src={portraitUrl}
            onLoad={(evt) => {
              if (
                evt.currentTarget.naturalWidth > evt.currentTarget.naturalHeight
              ) {
                setIsTaller(false);
              } else {
                setIsTaller(true);
              }
            }}
          />
        ) : !loading ? (
          name ? (
            <Text
              fontSize={typeof size === "number" ? "lg" : fontVariants[size]}
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
