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
    "--menu-item-icon": "{colors.fg.muted}",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "2",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "control.row",
    paddingBlock: "1.5",
    paddingInline: "10px",
    margin: 0,
    border: 0,
    borderRadius: "sm",
    background: "transparent",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "normal",
    lineHeight: "snug",
    textAlign: "start",
    textDecoration: "none",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    "&:not([data-disabled])": {
      "&[data-highlighted]": { background: "overlay.hover" },
      "&[data-popup-open]": { background: "overlay.selected" },
      _pressed: {
        background: "overlay.pressed",
        transitionDuration: "instant",
      },
    },
    _focusVisible: {
      boxShadow: "inset 0 0 0 2px token(colors.focusRing)",
    },
    "&[data-disabled]": {
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
        "&:not([data-disabled])": {
          "&[data-highlighted]": { background: "danger.soft" },
        },
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

/** Holds a checkbox or radio indicator so labels line up checked or not. */
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
