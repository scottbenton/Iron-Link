import type ExampleIcon from "@mui/icons-material/Casino";
import { Box, ButtonBase, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useState } from "react";

import { GradientRing } from "components/GradientRing";

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

// The width of the gradient ring, drawn around the whole button.
const RING_WIDTH = 2;
// The dark edge under a raised button's face; a press moves the face down by
// this much, onto it, so the edge disappears.
const EDGE_HEIGHT = 3;

// Holds the ring on the button just pressed, then lets it fade.
const justRolledRing = keyframes`
  0%, 55% { opacity: 1; }
  100% { opacity: 0; }
`;

/**
 * A dark, raised button showing a value, which rolls it (or runs another
 * action, like Reset on momentum). Its face sits on a dark edge and moves
 * down onto it while pressed. The theme's rotating gradient ring
 * (GradientRing) shows around the whole button on hover and keyboard focus,
 * and briefly after a press so the one just rolled stands out. Without `onClick` it draws the same face as
 * plain text, with no edge.
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
  // A raised face gives the edge's height to the edge, so the button takes
  // the same space either way (44px on touch for a meter).
  const edge = onClick ? EDGE_HEIGHT : 0;

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
        height: (isStat ? 52 : 32) - edge,
        // Narrow enough for five across a 320px phone.
        minWidth: isStat ? 56 : 48,
        px: 1,
        borderRadius: `${theme.shape.borderRadius - RING_WIDTH}px`,
        bgcolor: "grey.700",
        color: "common.white",
        [TOUCH_DEVICE_MEDIA_QUERY]: {
          height: (isStat ? 56 : TOUCH_TARGET_SIZE - 2 * RING_WIDTH) - edge,
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
        // The ripple covers the face and moves with it.
        ".MuiTouchRipple-root": {
          zIndex: 2,
          m: `${RING_WIDTH}px`,
          mb: `${RING_WIDTH + EDGE_HEIGHT}px`,
          borderRadius: `${theme.shape.borderRadius - RING_WIDTH}px`,
        },
        "& .roll-button-face, & .MuiTouchRipple-root": {
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.shortest,
          }),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        },
        "& .roll-button-ring": {
          opacity: 0,
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.short,
          }),
        },
        "@media (hover: hover)": {
          "&:hover .roll-button-ring": { opacity: 1 },
        },
        "&.Mui-focusVisible .roll-button-ring": { opacity: 1 },
        // Pressed (pointer, or Space on the keyboard): the face moves down
        // onto its edge, covering it.
        "&:active .roll-button-face, &:active .MuiTouchRipple-root": {
          transform: `translateY(${EDGE_HEIGHT}px)`,
        },
        "& .roll-button-flash": {
          animation: `${justRolledRing} 2600ms ease-out forwards`,
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            opacity: 0,
          },
        },
      })}
    >
      {/* Only the ring is painted (the middle is masked out), so nothing
          inside it can cover it and the space a pressed face leaves stays
          clear. */}
      <GradientRing ringWidth={RING_WIDTH} className="roll-button-ring" />
      {pressCount > 0 && (
        <GradientRing
          key={pressCount}
          ringWidth={RING_WIDTH}
          className="roll-button-flash"
        />
      )}
      <Box
        component="span"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "block",
          pb: `${EDGE_HEIGHT}px`,
        }}
      >
        <Box
          component="span"
          aria-hidden
          className="roll-button-edge"
          sx={(theme) => ({
            position: "absolute",
            inset: 0,
            top: EDGE_HEIGHT,
            borderRadius: `${theme.shape.borderRadius - RING_WIDTH}px`,
            bgcolor:
              theme.palette.mode === "light"
                ? theme.palette.grey[900]
                : theme.palette.background.default,
          })}
        />
        {face}
      </Box>
    </ButtonBase>
  );
}
