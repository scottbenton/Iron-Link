import type { SystemStyleObject } from "styled-system/types";

const ring = "2px solid token(colors.focusRing)";

/**
 * The keyboard focus ring, one 2px line in the scheme's colour. Spread it
 * into `_focusVisible` (or a `:has(:focus-visible)` rule) rather than
 * writing the outline out, so every control rings the same way.
 */
export const focusRing = {
  /** Outside the control, for buttons, cards and anything standing alone. */
  outset: { outline: ring, outlineOffset: "2px" },
  /**
   * Inside the control, for rows and tabs in a container that clips (a
   * list, a menu, a scroll area), where an outside ring would be cut off.
   */
  inset: { outline: ring, outlineOffset: "-2px" },
} satisfies Record<string, SystemStyleObject>;
