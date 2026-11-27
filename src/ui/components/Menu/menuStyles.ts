import {
  disabledSelector,
  highlightedSelector,
  quietPressable,
} from "ui/styles/pressable";

import { css, cva } from "styled-system/css";

/** The menu's card. Long menus scroll inside the space left on screen. */
export const menuPopupStyles = css({
  minWidth: "180px",
  maxWidth: "min(360px, calc(100vw - 16px))",
  maxHeight: "var(--available-height)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "1",
  borderRadius: "md",
});

/**
 * One row of a menu. Rows have no ledge, so they never move: hover and
 * keyboard highlight take `overlay.hover`, a press `overlay.pressed`.
 */
export const menuItemStyles = cva({
  base: {
    ...quietPressable,
    "--menu-item-icon": "{colors.fg.muted}",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "2",
    width: "100%",
    minHeight: "control.row",
    paddingBlock: "1.5",
    paddingInline: "10px",
    borderRadius: "sm",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "normal",
    lineHeight: "snug",
    textAlign: "start",
    userSelect: "none",
    // The open submenu's row keeps a tint, so it shows what it belongs to.
    "&[data-popup-open]:not([data-disabled])": {
      background: "overlay.selected",
    },
    _focusVisible: {
      boxShadow: "inset 0 0 0 2px token(colors.focusRing)",
    },
    [disabledSelector]: {
      "--menu-item-icon": "{colors.fg.disabled}",
      color: "fg.disabled",
      cursor: "default",
    },
    "& svg": { flex: "none", width: "icon.md", height: "icon.md" },
    _touch: { minHeight: "touch" },
  },
  variants: {
    tone: {
      default: {},
      /** A destructive action, such as Delete Character. */
      danger: {
        "--menu-item-icon": "currentColor",
        color: "danger.fg",
        _hoverable: { _hover: { background: "danger.soft" } },
        [highlightedSelector]: { background: "danger.soft" },
      },
    },
  },
  defaultVariants: { tone: "default" },
});

/** The leading icon, like MUI's ListItemIcon. */
export const menuItemIconStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  width: "icon.md",
  color: "var(--menu-item-icon)",
});

/**
 * Holds a checkbox or radio indicator at the end of the row, so the row
 * keeps its width checked or not.
 */
export const menuItemIndicatorSlotStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  width: "icon.md",
  height: "icon.md",
  color: "accent.fg",
  "[data-disabled] &": { color: "fg.disabled" },
  "& svg": { width: "icon.md", height: "icon.md" },
});

export const menuItemLabelStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
  whiteSpace: "normal",
});

export const menuItemDescriptionStyles = css({
  fontSize: "xs",
  color: "fg.muted",
  "[data-disabled] &": { color: "fg.disabled" },
});

/** Right-hand text: a keyboard shortcut or a short value. */
export const menuItemShortcutStyles = css({
  flex: "none",
  marginInlineStart: "auto",
  paddingInlineStart: "4",
  fontSize: "xs",
  color: "fg.subtle",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "0.02em",
});

/** Leaves room for an icon on rows without one, so labels line up. */
export const menuItemInsetStyles = css({
  paddingInlineStart: "calc(10px + 18px + token(spacing.2))",
});

export const menuGroupLabelStyles = css({
  display: "block",
  paddingInline: "10px",
  paddingBlockStart: "10px",
  paddingBlockEnd: "1",
  fontFamily: "heading",
  fontSize: "xs",
  fontWeight: "bold",
  lineHeight: "snug",
  letterSpacing: "label",
  textTransform: "uppercase",
  color: "fg.muted",
  userSelect: "none",
});

export const menuSeparatorStyles = css({
  height: "1px",
  marginBlock: "1",
  marginInline: "0.5",
  background: "border.subtle",
  border: 0,
});
