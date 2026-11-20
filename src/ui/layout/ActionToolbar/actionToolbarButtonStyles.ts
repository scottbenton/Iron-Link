import { focusRing } from "ui/styles/focus";
import { quietPressable, quietSelected } from "ui/styles/pressable";

import { cva } from "styled-system/css";

/**
 * Toolbar buttons have no ledge, so they never move: hover tints them and a
 * press darkens the tint (README, the look).
 */
export const toolbarButtonStyles = cva({
  base: {
    ...quietPressable,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    flex: "none",
    minHeight: "control.sm",
    minWidth: "control.sm",
    paddingInline: "3",
    borderRadius: "sm",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "semibold",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    "& svg": { width: "icon.md", height: "icon.md", flex: "none" },
    _focusVisible: focusRing.inset,
    ...quietSelected,
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
    },
    _touch: { minHeight: "control.md", minWidth: "control.md" },
  },
  variants: {
    iconOnly: { true: { paddingInline: 0 }, false: {} },
    /** Red text, for a destructive action that asks to confirm. */
    danger: { true: { color: "danger.fg" }, false: {} },
  },
});
