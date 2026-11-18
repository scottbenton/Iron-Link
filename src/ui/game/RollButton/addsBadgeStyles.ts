import { css } from "styled-system/css";

/**
 * The one look for adds (a bonus or penalty on the next roll) wherever a
 * roll starts: stat cards, condition meter rollers and roll buttons. A small
 * pill in the scheme's solid colour, pinned to the control's top-right
 * corner by `AddsAnchor` and ringed in the page colour so it reads as sitting
 * on top of the control's edge.
 */
export const addsBadgeStyles = css({
  position: "absolute",
  zIndex: 1,
  top: "-6px",
  right: "-6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "22px",
  height: "18px",
  paddingInline: "1",
  borderRadius: "full",
  background: "accent.solid",
  color: "accent.onSolid",
  boxShadow:
    "0 0 0 2px token(colors.bg.surface), 0 0 0 3px token(colors.accent.edge)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "2xs",
  lineHeight: "none",
  letterSpacing: "0.02em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  textTransform: "none",
  pointerEvents: "none",
  // The number moves on its own when adds change, which an inline box can't.
  "& [data-adds-value]": { display: "inline-block" },
  // Adds arriving: a quick fade and grow from half size with the out curve.
  // Leaving uses the `data-hidden` state's own, faster timing (below). A
  // change of value is a small bump and a number fade run from script
  // (`AddsBadge`), so it never fights these transitions.
  transitionProperty: "translate, opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  // Adds cleared: the badge keeps its last value and shrinks away over
  // `instant` with the in curve, faster than it came.
  "&[data-hidden]": {
    opacity: 0,
    scale: "0.5",
    transitionDuration: "instant",
    transitionTimingFunction: "in",
  },
  // The badge follows the control as it sinks on press.
  "[data-adds-anchor]:has(> :active:not(:disabled, [data-disabled])) > &": {
    translate: "0 var(--spacing-sink)",
    transitionDuration: "instant",
  },
  // A blocked roll greys its adds too, so nothing on it looks live.
  "[data-adds-anchor]:has(> :is(:disabled, [data-disabled])) > &": {
    "&:not([data-hidden])": { filter: "grayscale(1)", opacity: 0.7 },
  },
  // Reduced motion (the system's, unless Iron Link's setting says full, or
  // Iron Link's own): no motion at all. The badge appears and goes at once
  // and a change of value just swaps the number (`playAddsChange` skips).
  "@media (prefers-reduced-motion: reduce)": {
    ":root:not([data-motion=full]) &": {
      scale: "1",
      transition: "none",
    },
  },
  ":root[data-motion=reduced] &": {
    scale: "1",
    transition: "none",
  },
});

/** The box around a roll control that its adds badge is pinned to. */
export const addsAnchorStyles = css({
  position: "relative",
  display: "inline-grid",
  minWidth: 0,
  "&[data-full-width]": { display: "grid", width: "100%" },
});
