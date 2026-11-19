import { focusRing } from "ui/styles/focus";

import { css } from "styled-system/css";

/**
 * Section tabs, the segmented track: they switch the parts of a column (a
 * sidebar's panels, the phone's game sections). They never move; the
 * selected one is a raised card on the track.
 */
export const sectionTabListStyles = css({
  boxSizing: "border-box",
  display: "flex",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
  padding: "0.5",
  borderRadius: "md",
  background: "bg.emphasized",
});

export const sectionTabStyles = css({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1.5",
  flex: "1 1 0",
  minWidth: 0,
  minHeight: "control.sm",
  paddingInline: "2",
  border: "1px solid transparent",
  borderRadius: "sm",
  background: "transparent",
  color: "fg.muted",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transitionProperty: "background-color, color, border-color, box-shadow",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  "& svg": { width: "icon.md", height: "icon.md", flex: "none" },
  _hover: { color: "fg.default" },
  _focusVisible: focusRing.outset,
  _current: {
    background: "bg.surface",
    borderColor: "border.default",
    boxShadow: "0 1px 0 token(colors.border.default)",
    color: "fg.default",
  },
  _touch: { minHeight: "control.md" },
});

export const srOnlyStyles = css({
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});
