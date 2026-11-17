import BackgroundIcon from "@mui/icons-material/Face";
import {
  Box,
  Skeleton,
  SxProps,
  Theme,
  Typography,
  TypographyVariant,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { themeConfig } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

export type AvatarSizes = "small" | "medium" | "large" | "huge";

export const AVATAR_SIZES: { [key in AvatarSizes]: number } = {
  small: 44,
  medium: 60,
  large: 88,
  huge: 200,
};

const variants: { [key in AvatarSizes]: TypographyVariant } = {
  small: "h6",
  medium: "h5",
  large: "h4",
  huge: "h1",
};

export interface PortraitAvatarDisplayProps {
  size?: AvatarSizes;
  rounded?: boolean;

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
  borderColor?: "folow-theme" | ColorScheme;
  // Set where the character's name is already shown beside the portrait, so
  // screen readers skip it instead of reading the name twice.
  decorative?: boolean;
  sx?: SxProps<Theme>;
}

export function PortraitAvatarDisplay(props: PortraitAvatarDisplayProps) {
  const {
    size = "medium",
    borderColor = "follow-theme",
    borderWidth = 2,
    rounded,
    portraitSettings,
    portraitUrl,
    name,
    loading,
    decorative,
    sx,
  } = props;

  const { t } = useTranslation();

  // The portrait is one named image, whether it shows a picture or the
  // name's first letter. Without a name there is nothing useful to say.
  const a11yProps =
    decorative || loading || !name
      ? { "aria-hidden": true }
      : {
          role: "img",
          "aria-label": t("character.portrait-of", "Portrait of {{name}}", {
            name,
          }),
        };

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
      {...a11yProps}
      width={AVATAR_SIZES[size]}
      height={AVATAR_SIZES[size]}
      overflow={"hidden"}
      sx={[
        (theme) => ({
          backgroundColor:
            theme.palette.mode === "light" ? "grey.300" : "grey.700",
          color: "text.primary",
          display: portraitUrl ? "block" : "flex",
          alignItems: "center",
          justifyContent: "center",
          borderWidth,
          borderStyle: "solid",
          borderColor:
            borderColor === "follow-theme"
              ? theme.palette.divider
              : themeConfig[borderColor as ColorScheme][
                  theme.palette.mode === "light" ? "light" : "dark"
                ].primary.main,
          borderRadius: rounded ? "100%" : `${theme.shape.borderRadius}px`,
          "&>img": {
            width: isTaller ? `${100 * scale}%` : "auto",
            height: isTaller ? "auto" : `${100 * scale}%`,
            position: "relative",
            transform: `translate(calc(${marginLeft}% + ${
              AVATAR_SIZES[size] / 2
            }px - ${borderWidth}px), calc(${marginTop}% + ${AVATAR_SIZES[size] / 2}px - ${borderWidth}px))`,
          },
          flexShrink: 0,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
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
          alt=""
        />
      ) : !loading ? (
        name ? (
          <Typography
            variant={variants[size]}
            component="span"
            aria-hidden
            fontWeight={size === "huge" ? 600 : undefined}
          >
            {name[0]}
          </Typography>
        ) : (
          <BackgroundIcon />
        )
      ) : (
        <Skeleton
          variant={"rectangular"}
          sx={{ flexGrow: 1, height: "100%" }}
        />
      )}
    </Box>
  );
}
