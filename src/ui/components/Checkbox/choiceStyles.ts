import { css, cva } from "styled-system/css";

/**
 * Checkbox and radio share one look, from the Workbench: the box sinks into
 * the page like a field; when chosen, a fill grows out from the centre and
 * the tick draws in after it. The whole row presses the box in a little.
 */

/** The item around one choice. */
export const choiceItemStyles = css({
  boxSizing: "border-box",
  display: "grid",
  minWidth: 0,
});

/**
 * The label: box, then the title with its description under it. The whole
 * of it is the click target, description included, while the control's name
 * stays the title alone (see ChoiceItem).
 */
export const choiceLabelStyles = cva({
  base: {
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    width: "fit-content",
    maxWidth: "100%",
    minHeight: "32px",
    paddingBlock: "6px",
    margin: 0,
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "normal",
    lineHeight: "20px",
    color: "fg.default",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    "&[data-disabled]": { cursor: "not-allowed", color: "fg.subtle" },
    // A 44px row for one line; the box stays beside the title.
    _touch: { minHeight: "touch", paddingBlock: "3" },
  },
  variants: {
    size: {
      sm: { minHeight: "28px", paddingBlock: "4px", gap: "2" },
      md: {},
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * The title and description, stacked with no gap so they read as one
 * choice: the space between them is only their leading, about 5px, against
 * the 24px or more between one choice and the next.
 */
export const choiceTextStyles = css({
  display: "grid",
  gap: 0,
  minWidth: 0,
  overflowWrap: "anywhere",
});

/** The muted line under a choice's title, lined up with it. */
export const choiceDescriptionStyles = cva({
  base: {
    display: "block",
    margin: 0,
    fontFamily: "body",
    fontSize: "xs",
    lineHeight: "16px",
    color: "fg.muted",
    "[data-disabled] &": { color: "fg.disabled" },
  },
  variants: {
    size: { sm: {}, md: {} },
  },
  defaultVariants: { size: "md" },
});

/** The box (checkbox) or circle (radio), and what fills it. */
export const choiceBoxStyles = cva({
  base: {
    "--choice-size": "20px",
    "--choice-border": "1.5px",
    boxSizing: "border-box",
    position: "relative",
    display: "inline-grid",
    placeItems: "center",
    flex: "none",
    width: "var(--choice-size)",
    height: "var(--choice-size)",
    margin: 0,
    padding: 0,
    borderWidth: "var(--choice-border)",
    borderStyle: "solid",
    borderColor: "border.control",
    background: "bg.field",
    boxShadow: "field",
    color: "accent.onSolid",
    cursor: "pointer",
    outline: "none",
    transitionProperty: "border-color, scale",
    transitionDuration: "token(durations.fast), token(durations.instant)",
    transitionTimingFunction: "linear, token(easings.out)",
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    "label:hover > &": {
      "&:not([data-disabled], [data-checked], [data-indeterminate])": {
        borderColor: "fg.muted",
      },
    },
    "&:is([data-checked], [data-indeterminate])": {
      borderColor: "accent.solid",
    },
    "&[data-invalid]:not([data-checked])": { borderColor: "danger.fg" },
    "label:active > &": { "&:not([data-disabled])": { scale: "0.9" } },
    "&[data-disabled]": {
      cursor: "not-allowed",
      background: "bg.muted",
      borderColor: "border.default",
      boxShadow: "none",
    },
    "&[data-disabled]:is([data-checked], [data-indeterminate])": {
      borderColor: "fg.disabled",
    },
    _reducedMotion: { "label:active > &": { scale: "1" } },
  },
  variants: {
    shape: {
      checkbox: { borderRadius: "xs" },
      radio: { borderRadius: "full" },
    },
    size: {
      sm: { "--choice-size": "16px", marginTop: "2px" },
      md: {},
    },
  },
  defaultVariants: { shape: "checkbox", size: "md" },
});

/** The fill inside a checkbox: it covers the border once ticked. */
export const checkboxFillStyles = css({
  position: "absolute",
  inset: "calc(-1 * var(--choice-border))",
  borderRadius: "xs",
  background: "accent.solid",
  pointerEvents: "none",
  opacity: 0,
  scale: "0.4",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "token(easings.out), token(easings.in)",
  "[data-checked] > &, [data-indeterminate] > &": {
    opacity: 1,
    scale: "1",
    transitionDuration: "token(durations.fast), token(durations.normal)",
    transitionTimingFunction: "out",
  },
  "[data-disabled] > &": { background: "fg.disabled" },
  _reducedMotion: { scale: "1" },
});

const drawIn =
  "stroke-dashoffset token(durations.slow) token(easings.out) 70ms";

/** The tick and the indeterminate dash, drawn in with a stroke. */
export const checkboxMarkStyles = css({
  position: "relative",
  zIndex: 1,
  width: "calc(var(--choice-size) * 0.7)",
  height: "calc(var(--choice-size) * 0.7)",
  pointerEvents: "none",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "& path": {
    strokeDasharray: "var(--mark-length)",
    strokeDashoffset: "var(--mark-length)",
    transition: "stroke-dashoffset token(durations.fast) token(easings.in)",
  },
  "& [data-mark=tick]": { "--mark-length": "24" },
  "& [data-mark=dash]": { "--mark-length": "13" },
  "[data-checked]:not([data-indeterminate]) > &": {
    "& [data-mark=tick]": { strokeDashoffset: 0, transition: drawIn },
  },
  "[data-indeterminate] > &": {
    "& [data-mark=dash]": { strokeDashoffset: 0, transition: drawIn },
  },
  "[data-disabled] > &": { color: "bg.surface" },
});

/** The dot inside a chosen radio. */
export const radioDotStyles = css({
  width: "calc(var(--choice-size) * 0.4)",
  height: "calc(var(--choice-size) * 0.4)",
  borderRadius: "full",
  background: "accent.solid",
  pointerEvents: "none",
  opacity: 0,
  scale: "0",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "token(easings.out), token(easings.in)",
  "&[data-checked]": {
    opacity: 1,
    scale: "1",
    transitionDuration: "token(durations.fast), token(durations.normal)",
    transitionTimingFunction: "out",
  },
  "[data-disabled] > &": { background: "fg.disabled" },
  _reducedMotion: { scale: "1" },
});

/**
 * The column or row a group lays its choices in. Choices with descriptions
 * get more room between them (12px on top of each row's own padding), so
 * each title and its description read as one choice, set apart from the
 * next.
 */
export const choiceListStyles = cva({
  base: {
    display: "grid",
    rowGap: "0.5",
    minWidth: 0,
    "&:has([data-choice-description])": { rowGap: "3" },
  },
  variants: {
    orientation: {
      vertical: {},
      horizontal: {
        display: "flex",
        flexWrap: "wrap",
        columnGap: "5",
      },
    },
  },
  defaultVariants: { orientation: "vertical" },
});
