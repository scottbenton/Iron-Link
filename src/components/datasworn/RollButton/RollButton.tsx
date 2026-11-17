import type ExampleIcon from "@mui/icons-material/Casino";
import { Box, ButtonBase, SxProps, Theme, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useState } from "react";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

export interface RollButtonProps {
  /** The value as shown, already formatted ("+2"). */
  value: string;
  /** A label drawn inside the button above the value (a stat's name). */
  label?: string;
  ActionIcon?: typeof ExampleIcon;
  /** Without it the button is drawn as a plain, inert value. */
  onClick?: () => void;
  /** The button's name, which says what it does ("Roll Edge, +2"). */
  "aria-label"?: string;
  "data-testid"?: string;
  /** Marks the icon, for tests that look for it. */
  iconTestId?: string;
  /** "stat" is tall, with the label; "meter" is one line, between - and +. */
  size?: "stat" | "meter";
}

// The gap the gradient ring shows through, around the button's face.
const RING_WIDTH = 2;

// Holds the ring on the button just pressed, then lets it fade.
const justRolledRing = keyframes`
  0%, 55% { opacity: 1; }
  100% { opacity: 0; }
`;

/**
 * A dark, raised button showing a value, which rolls it (or runs another
 * action, like Reset on momentum). The theme's gradient ring shows around it
 * on hover and keyboard focus, and briefly after a press so the one just
 * rolled stands out. Without `onClick` it draws the same face as plain text.
 */
export function RollButton(props: RollButtonProps) {
  const {
    value,
    label,
    ActionIcon,
    onClick,
    "aria-label": ariaLabel,
    "data-testid": dataTestId,
    iconTestId,
    size = "meter",
  } = props;

  // Each press remounts the flash ring, so pressing again replays it.
  const [pressCount, setPressCount] = useState(0);

  const isStat = size === "stat";

  const face = (
    <Box
      component="span"
      className="roll-button-face"
      sx={(theme) => ({
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: isStat ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: isStat ? 0 : 0.5,
        height: isStat ? 52 : 32,
        // Narrow enough for five across a 320px phone.
        minWidth: isStat ? 56 : 48,
        px: 1,
        borderRadius: `${theme.shape.borderRadius - RING_WIDTH}px`,
        bgcolor: "grey.700",
        color: "common.white",
        boxShadow: onClick
          ? `0 2px 0 ${
              theme.palette.mode === "light"
                ? theme.palette.grey[900]
                : theme.palette.background.default
            }`
          : undefined,
        transition: theme.transitions.create("box-shadow", {
          duration: theme.transitions.duration.shortest,
        }),
        [TOUCH_DEVICE_MEDIA_QUERY]: {
          height: isStat ? 56 : TOUCH_TARGET_SIZE - 2 * RING_WIDTH,
        },
      })}
    >
      {label && (
        <Typography
          component="span"
          variant="caption"
          fontWeight={600}
          lineHeight={1.2}
          textTransform="uppercase"
          letterSpacing={0.3}
          color="grey.200"
          maxWidth="100%"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {label}
        </Typography>
      )}
      <Box component="span" display="flex" alignItems="center" gap={0.5}>
        {ActionIcon && onClick && (
          <ActionIcon
            data-testid={iconTestId}
            aria-hidden
            sx={{ fontSize: 16, color: "grey.300" }}
          />
        )}
        <Typography
          component="span"
          variant="h5"
          lineHeight={1}
          fontWeight={600}
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  const ringSx: SxProps<Theme> = (theme) => ({
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: theme.palette.gradients.outline,
    pointerEvents: "none",
  });

  if (!onClick) {
    return (
      <Box
        data-testid={dataTestId}
        sx={(theme) => ({
          p: `${RING_WIDTH}px`,
          minWidth: 0,
          borderRadius: `${theme.shape.borderRadius}px`,
        })}
      >
        {face}
      </Box>
    );
  }

  return (
    <ButtonBase
      focusRipple
      aria-label={ariaLabel}
      data-testid={dataTestId}
      onClick={() => {
        setPressCount((count) => count + 1);
        onClick();
      }}
      sx={(theme) => ({
        position: "relative",
        display: "block",
        minWidth: 0,
        p: `${RING_WIDTH}px`,
        borderRadius: `${theme.shape.borderRadius}px`,
        textAlign: "center",
        ".MuiTouchRipple-root": {
          zIndex: 2,
          m: `${RING_WIDTH}px`,
          borderRadius: `${theme.shape.borderRadius - RING_WIDTH}px`,
        },
        "& .roll-button-ring": {
          opacity: 0,
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.short,
          }),
        },
        "@media (hover: hover)": {
          "&:hover .roll-button-ring": { opacity: 1 },
          "&:hover .roll-button-face": { boxShadow: "none" },
        },
        "&.Mui-focusVisible .roll-button-ring": { opacity: 1 },
        "&.Mui-focusVisible .roll-button-face": { boxShadow: "none" },
        "& .roll-button-flash": {
          animation: `${justRolledRing} 2600ms ease-out forwards`,
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            opacity: 0,
          },
        },
      })}
    >
      <Box
        component="span"
        aria-hidden
        className="roll-button-ring"
        sx={ringSx}
      />
      {pressCount > 0 && (
        <Box
          key={pressCount}
          component="span"
          aria-hidden
          className="roll-button-flash"
          sx={ringSx}
        />
      )}
      {face}
    </ButtonBase>
  );
}
