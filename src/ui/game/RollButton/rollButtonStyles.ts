import { cva } from "styled-system/css";

/**
 * What a roll button adds to the gradient button: a large size and a
 * wrapping label at full width. Everything else, face and type included,
 * is the gradient button's own. The rules are keyed on `data-roll` as well
 * as the class, so they outrank the button recipe whatever the stylesheet
 * order; its disabled and busy rules still win.
 */
export const rollButtonStyles = cva({
  base: {},
  variants: {
    size: {
      sm: {},
      md: {},
      lg: {
        "&[data-roll]": {
          "--btn-pad": "token(spacing.5)",
          minHeight: "touch",
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
