import { focusRing } from "ui/styles/focus";
import { pressableReset } from "ui/styles/pressable";

import { cva } from "styled-system/css";

export const buttonStyles = cva({
  base: {
    ...pressableReset,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    flex: "none",
    height: "control.sm",
    borderRadius: "sm",
    color: "fg.muted",
    fontFamily: "body",
    fontWeight: "semibold",
    fontSize: "sm",
    whiteSpace: "nowrap",
    userSelect: "none",
    // Toolbar buttons have no ledge: they never move, they change colour,
    // fill and text together. A pressed toggle is a neutral overlay fill,
    // like a ghost, neutral ToggleGroup, so the bar stays quiet. The rules
    // rely on specificity, not source order (Panda sorts atomic rules):
    // hover 0,3,0; a held press and a hovered pressed toggle 0,4,0 with the
    // same fill.
    transition:
      "background-color token(durations.fast) linear, color token(durations.fast) linear",
    _hoverable: {
      "&:hover:not([aria-pressed=true], :disabled, [data-disabled])": {
        background: "overlay.hover",
        color: "fg.default",
      },
      "&[aria-pressed=true]:hover:not(:disabled, [data-disabled])": {
        background: "overlay.pressed",
      },
    },
    "&:is(:active, [data-pressed]):not(:disabled):not([data-disabled])": {
      background: "overlay.pressed",
      color: "fg.default",
      transitionDuration: "instant",
    },
    "&[aria-pressed=true]": {
      background: "overlay.selected",
      color: "fg.default",
    },
    _focusVisible: focusRing.inset,
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
    },
    "& svg": { flex: "none", width: "icon.md", height: "icon.md" },
    _touch: { height: "touch" },
  },
  variants: {
    iconOnly: {
      true: { width: "control.sm", padding: 0, _touch: { width: "touch" } },
      false: { paddingInline: "2" },
    },
  },
});
