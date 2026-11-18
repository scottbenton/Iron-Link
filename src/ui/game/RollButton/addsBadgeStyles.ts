import { css } from "styled-system/css";

/**
 * The one look for adds (a bonus or penalty on the next roll) wherever a
 * roll starts: stat cards, condition meter rollers and roll buttons. A small
 * pill in the scheme's solid colour, set right after the number it changes,
 * so "+2 [+1]" reads as "+2, plus 1 on this roll". It sits on the dark roll
 * surfaces, where the accent stands out from the white numbers.
 */
export const addsBadgeStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  minWidth: "20px",
  height: "16px",
  paddingInline: "1",
  borderRadius: "full",
  background: "accent.solid",
  color: "accent.onSolid",
  boxShadow: "0 0 0 1px token(colors.accent.edge)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "2xs",
  lineHeight: "none",
  letterSpacing: "0.02em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  textTransform: "none",
  // A blocked roll greys its adds too, so nothing on it looks live.
  ":is(:disabled, [data-disabled]) &": {
    filter: "grayscale(1)",
    opacity: 0.7,
  },
});
