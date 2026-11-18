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
  transitionProperty: "translate",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  // The badge follows the control as it sinks on press.
  "[data-adds-anchor]:has(> :active:not(:disabled, [data-disabled])) > &": {
    translate: "0 var(--spacing-sink)",
    transitionDuration: "instant",
  },
  // A blocked roll greys its adds too, so nothing on it looks live.
  "[data-adds-anchor]:has(> :is(:disabled, [data-disabled])) > &": {
    filter: "grayscale(1)",
    opacity: 0.7,
  },
});

/** The box around a roll control that its adds badge is pinned to. */
export const addsAnchorStyles = css({
  position: "relative",
  display: "inline-grid",
  minWidth: 0,
  "&[data-full-width]": { display: "grid", width: "100%" },
});
