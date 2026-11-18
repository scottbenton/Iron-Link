import { css } from "styled-system/css";

/**
 * The positioner around a listbox popup. Popups sit above dialogs, so a
 * select inside a dialog opens over it.
 */
export const listPositionerStyles = css({
  zIndex: "popover",
  outline: "none",
});

/**
 * The listbox popup Select and Combobox share, from the Workbench: a surface
 * card with a control border and a soft shadow, that grows from its anchor
 * on open and shrinks back faster on close.
 */
export const listPopupStyles = css({
  boxSizing: "border-box",
  minWidth: "var(--anchor-width)",
  maxWidth: "var(--available-width)",
  maxHeight: "min(var(--available-height), 360px)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
  boxShadow: "popover",
  outline: "none",
  transformOrigin: "var(--transform-origin)",
  transitionProperty: "opacity, scale, translate",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  scrollPaddingBlock: "1",
  _startingStyle: { opacity: 0, scale: "0.97", translate: "0 -4px" },
  _endingStyle: {
    opacity: 0,
    scale: "0.97",
    translate: "0 -4px",
    transitionDuration: "instant",
    transitionTimingFunction: "in",
  },
  "&[data-side=top]": {
    _startingStyle: { translate: "0 4px" },
    _endingStyle: { translate: "0 4px" },
  },
  _reducedMotion: {
    _startingStyle: { scale: "1", translate: "0 0" },
    _endingStyle: { scale: "1", translate: "0 0" },
  },
});

/** The list inside a popup. */
export const listStyles = css({
  outline: "none",
  "&:empty": { display: "none" },
});

/**
 * An option. It never moves; hover and keyboard highlight both answer with
 * `overlay.hover`, and the chosen one is semibold with a check at its end.
 */
export const listItemStyles = css({
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "2",
  width: "100%",
  minHeight: "36px",
  paddingBlock: "1.5",
  paddingInline: "10px",
  borderRadius: "sm",
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.default",
  cursor: "default",
  userSelect: "none",
  outline: "none",
  scrollMarginBlock: "1",
  WebkitTapHighlightColor: "transparent",
  "&[data-highlighted]": { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  "&:is([data-selected], [aria-selected=true])": { fontWeight: "semibold" },
  "&[data-disabled]": {
    color: "fg.disabled",
    cursor: "not-allowed",
    background: "transparent",
  },
  _touch: { minHeight: "touch" },
});

/** The leading icon of an option. */
export const listItemIconStyles = css({
  display: "inline-flex",
  flex: "none",
  color: "fg.muted",
  "& > svg": { width: "18px", height: "18px" },
  "[data-disabled] &": { color: "fg.disabled" },
});

/** The label and description of an option. */
export const listItemTextStyles = css({
  display: "grid",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
});

/** An option's second line. */
export const listItemDescriptionStyles = css({
  fontSize: "xs",
  fontWeight: "normal",
  color: "fg.muted",
  "[data-disabled] &": { color: "fg.disabled" },
});

/**
 * The check at the end of an option. Its space is always kept, so choosing
 * an option never shifts the text.
 */
export const listItemCheckStyles = css({
  display: "inline-flex",
  flex: "none",
  marginInlineStart: "auto",
  color: "accent.fg",
  visibility: "hidden",
  "& > svg": { width: "16px", height: "16px" },
  "[data-selected] > &, [aria-selected=true] > &": { visibility: "visible" },
});

/** A group's heading inside a popup. */
export const listGroupLabelStyles = css({
  paddingTop: "2",
  paddingBottom: "1",
  paddingInline: "10px",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  userSelect: "none",
});

/** A line between groups. */
export const listSeparatorStyles = css({
  height: "1px",
  marginBlock: "1",
  marginInline: "0.5",
  background: "border.subtle",
  border: 0,
});

/** The row that says why the list is empty or still loading. */
export const listStatusStyles = css({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: "2",
  minHeight: "36px",
  paddingInline: "10px",
  fontSize: "sm",
  color: "fg.muted",
  "&:empty": { display: "none" },
});
