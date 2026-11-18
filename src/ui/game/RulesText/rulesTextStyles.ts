import { css, cva } from "styled-system/css";

/**
 * The compact table shared by rules text and oracle tables: hairline
 * borders, a muted header row in the heading face, quiet zebra rows.
 */
export const compactTableStyles = css({
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  overflow: "hidden",
  lineHeight: "snug",
  fontVariantNumeric: "tabular-nums",
  "& th": {
    paddingBlock: "1.5",
    paddingInline: "2.5",
    background: "bg.muted",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
    fontFamily: "heading",
    fontWeight: "semibold",
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "label",
    color: "fg.muted",
    textAlign: "left",
    verticalAlign: "bottom",
  },
  "& td": {
    paddingBlock: "1",
    paddingInline: "2.5",
    textAlign: "left",
    verticalAlign: "top",
    color: "fg.default",
  },
  "& tbody tr:nth-of-type(even) td": {
    background: "color-mix(in oklab, token(colors.bg.muted) 70%, transparent)",
  },
  "& tbody tr + tr td": {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.subtle",
  },
});

/** Scrolls a wide table sideways rather than the page. */
export const tableScrollStyles = css({
  maxWidth: "100%",
  overflowX: "auto",
  marginBlockEnd: "0.75em",
  "&:last-child": { marginBlockEnd: 0 },
});

export const rulesTextStyles = cva({
  base: {
    color: "var(--rules-text-color)",
    fontFamily: "body",
    lineHeight: "normal",
    overflowWrap: "break-word",
    "& > :first-child": { marginBlockStart: 0 },
    "& > :last-child": { marginBlockEnd: 0 },
    "& p": { margin: "0 0 0.6em" },
    "& :is(strong, b)": {
      fontWeight: "semibold",
      color: "var(--rules-text-strong)",
    },
    "& em": { fontStyle: "italic" },
    "& :is(ul, ol)": {
      margin: "0 0 0.6em",
      paddingInlineStart: "1.35em",
      display: "grid",
      gap: "0.3em",
    },
    "& ul": { listStyleType: "disc" },
    "& ol": { listStyleType: "decimal" },
    "& li": { paddingInlineStart: "0.15em" },
    "& li::marker": { color: "fg.subtle" },
    "& li > p": { margin: 0 },
    "& blockquote": {
      margin: "0 0 0.6em",
      paddingBlock: "2",
      paddingInline: "4",
      borderInlineStart: "3px solid token(colors.border.control)",
      borderRadius: "0 token(radii.sm) token(radii.sm) 0",
      background: "bg.muted",
      color: "fg.muted",
    },
    "& hr": {
      border: 0,
      height: "1px",
      margin: "1em 0",
      background: "border.default",
    },
    "& code": {
      fontFamily: "mono",
      fontSize: "0.9em",
      paddingInline: "1",
      borderRadius: "xs",
      background: "bg.muted",
    },
    "& [data-rules-heading]": {
      display: "block",
      margin: "0.9em 0 0.35em",
      fontFamily: "heading",
      fontWeight: "semibold",
      fontSize: "1.1em",
      lineHeight: "tight",
      color: "var(--rules-text-strong)",
    },
  },
  variants: {
    size: {
      sm: { fontSize: "sm" },
      md: { fontSize: "md" },
    },
    color: {
      default: {
        "--rules-text-color": "{colors.fg.default}",
        "--rules-text-strong": "{colors.fg.default}",
      },
      muted: {
        "--rules-text-color": "{colors.fg.muted}",
        "--rules-text-strong": "{colors.fg.default}",
      },
      inherit: {
        "--rules-text-color": "inherit",
        "--rules-text-strong": "inherit",
      },
    },
  },
  defaultVariants: { size: "md", color: "default" },
});

/**
 * A `datasworn:` link: a button that reads as a link in the sentence, in
 * the accent colour with an underline that firms up on hover.
 */
export const rulesLinkStyles = css({
  display: "inline",
  padding: 0,
  margin: 0,
  border: 0,
  background: "transparent",
  font: "inherit",
  color: "accent.fg",
  fontWeight: "medium",
  textAlign: "inherit",
  textDecorationLine: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "0.18em",
  textDecorationColor:
    "color-mix(in oklab, token(colors.accent.fg) 40%, transparent)",
  cursor: "pointer",
  borderRadius: "xs",
  transitionProperty: "text-decoration-color, background-color",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _hover: { textDecorationColor: "accent.fg" },
  _pressed: { background: "overlay.pressed" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "1px",
  },
});
