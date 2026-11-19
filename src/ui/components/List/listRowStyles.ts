import { focusRing } from "ui/styles/focus";

import { css } from "styled-system/css";

/**
 * The line that holds a row and its optional end control (View table).
 * Both sit in one grid cell: the row fills the line and the control lies
 * over its end, so the row's hover and selected colour run under the
 * control to the edge, as one row. The row keeps the control's width clear
 * with `--row-action-width` (one small icon button by default; set it on
 * the line for a wider control).
 */
export const listRowLineStyles = css({
  "--row-action-width": "{sizes.control.sm}",
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
  _touch: { "--row-action-width": "{sizes.control.md}" },
  "& > *": { gridArea: "1 / 1" },
  "& > [data-row-action]": {
    zIndex: 1,
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    gap: "0.5",
    marginInlineEnd: "1",
  },
});

/**
 * A move or oracle row (`ListRow`), in the library's dense inset list metrics (36px,
 * 12px in from the start, rounded): name first, then a muted glyph for what
 * a press does (a chevron opens, a die rolls), then room for the end control.
 * Names wrap rather than truncate, so long names stay readable in a narrow
 * sidebar.
 */
export const listRowStyles = css({
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "2",
  boxSizing: "border-box",
  width: "100%",
  minHeight: "control.row",
  margin: 0,
  paddingBlock: "1.5",
  paddingInlineStart: "3",
  paddingInlineEnd: "2",
  border: 0,
  borderRadius: "md",
  background: "transparent",
  color: "fg.default",
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "medium",
  lineHeight: "snug",
  textAlign: "start",
  textDecoration: "none",
  cursor: "pointer",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  outline: "none",
  "[data-has-action] > &": {
    paddingInlineEnd:
      "calc(var(--row-action-width) + token(spacing.1) + token(spacing.2))",
  },
  _hoverable: {
    // The line, not the row, so hovering the end control keeps the row lit.
    "[data-row-line]:hover > &": {
      "&:not(:disabled, [data-disabled], [aria-current], :active, [data-pressed])":
        {
          background: "overlay.hover",
        },
    },
  },
  _pressed: { background: "overlay.pressed" },
  _current: {
    background: "overlay.selected",
    fontWeight: "semibold",
    "& [data-row-icon], & [data-row-glyph]": { color: "fg.default" },
  },
  _focusVisible: focusRing.inset,
  // A disabled row takes no pointer at all: no hover, no press, no cursor.
  "&:is(:disabled, [data-disabled], [aria-disabled=true])": {
    pointerEvents: "none",
    color: "fg.disabled",
    background: "transparent",
    "& [data-row-icon], & [data-row-glyph]": { color: "fg.disabled" },
  },
  "& [data-row-icon], & [data-row-glyph]": {
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "fg.muted",
  },
  "& [data-row-icon]": {
    width: "icon.md",
    height: "icon.md",
    "& svg": { width: "icon.md", height: "icon.md" },
  },
  "& [data-row-glyph]": {
    width: "16px",
    height: "16px",
    "& svg, &:is(svg)": { width: "16px", height: "16px" },
  },
  "& [data-row-name]": {
    flex: "1",
    minWidth: 0,
    overflowWrap: "anywhere",
    textWrap: "pretty",
  },
  _touch: { minHeight: "touch" },
});
