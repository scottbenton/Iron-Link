import { cva } from "styled-system/css";

/**
 * What a roll button changes on the gradient button: the chip face, the
 * heading type, the die's size and a large size. The rules are keyed on
 * `data-roll` as well as the class, so they outrank the button recipe's own
 * whatever the stylesheet order; its disabled and busy rules still win.
 */
export const rollButtonStyles = cva({
  base: {
    "&[data-roll]": {
      "--btn-face-base": "{colors.bg.chip}",
      "--btn-fg": "{colors.fg.onChip}",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "1.0625rem",
      letterSpacing: "0.02em",
      "& svg": { width: "1.1em", height: "1.1em" },
    },
  },
  variants: {
    size: {
      sm: { "&[data-roll]": { fontSize: "sm" } },
      md: {},
      lg: {
        "&[data-roll]": {
          "--btn-pad": "token(spacing.5)",
          minHeight: "46px",
          fontSize: "lg",
        },
      },
    },
    fullWidth: {
      // A full-width button in a narrow panel wraps its label rather than
      // spilling out; the die and the adds pill stay beside it.
      true: {
        "&[data-roll] [data-roll-label]": {
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          textAlign: "center",
        },
      },
    },
  },
  defaultVariants: { size: "md" },
});
