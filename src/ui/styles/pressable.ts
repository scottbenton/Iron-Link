import type { SystemStyleObject } from "styled-system/types";

/** A control that is off: no hover, no press, the disabled text colour. */
export const disabledSelector =
  "&:is(:disabled, [data-disabled], [aria-disabled=true])";

/**
 * The one list of "this is the chosen one" attributes, so every quiet
 * control reads selection the same way: the current page, the selected
 * option or row, and an on toggle.
 */
export const selectedSelector =
  "&:is([aria-current]:not([aria-current=false]), [aria-selected=true], [aria-pressed=true], [data-selected])";

/**
 * A popup row under the keyboard or pointer (Base UI's `data-highlighted`),
 * when it is not disabled.
 */
export const highlightedSelector =
  "&[data-highlighted]:not(:disabled, [data-disabled], [aria-disabled=true])";

/**
 * Strips a native button or link down to a bare target: no margin, border
 * or background, no tap flash and no default outline (pair it with a
 * `focusRing`). The control brings its own font, colour and padding.
 */
export const pressableReset = {
  boxSizing: "border-box",
  margin: 0,
  border: 0,
  background: "transparent",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
} satisfies SystemStyleObject;

/**
 * A quiet pressable: a row, menu item, toolbar button or trigger that has no
 * ledge and never moves. It answers with the overlay tints: `overlay.hover`
 * under a real pointer or a popup's highlight, `overlay.pressed` at once on
 * press. Disabled, it takes neither. Spread it first and keep only size,
 * padding and type; add `quietSelected` where a chosen row is tinted.
 */
export const quietPressable = {
  ...pressableReset,
  transitionProperty: "background-color",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  _hoverable: { _hover: { background: "overlay.hover" } },
  [highlightedSelector]: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed", transitionDuration: "instant" },
  [disabledSelector]: { cursor: "not-allowed", color: "fg.disabled" },
} satisfies SystemStyleObject;

/** The chosen one of a set of quiet pressables, tinted `overlay.selected`. */
export const quietSelected = {
  [selectedSelector]: { background: "overlay.selected" },
} satisfies SystemStyleObject;

/**
 * An overlay tint laid over a filled surface without replacing its fill,
 * for a quiet control on a coloured background (a chip, a header band).
 * Pass a colour token reference such as `token(colors.overlay.hover)`.
 */
export function overlayTint(color: string): SystemStyleObject {
  return { backgroundImage: `linear-gradient(${color}, ${color})` };
}
