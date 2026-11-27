import { css } from "styled-system/css";

export const tooltipPopupStyles = css({
  maxWidth: "280px",
  paddingBlock: "1",
  paddingInline: "2",
  borderRadius: "sm",
  background: "gray.900",
  color: "white",
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: "medium",
  lineHeight: "snug",
  boxShadow: "0 4px 12px -4px rgb(0 0 0 / 0.35)",
  transformOrigin: "var(--transform-origin)",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _dark: { background: "gray.100", color: "gray.950" },
  _startingStyle: { opacity: 0, scale: "0.96" },
  _endingStyle: { opacity: 0, scale: "0.96", transitionDuration: "instant" },
});

/**
 * The positioner is the positioned, transformed box Base UI portals to the
 * body, so the stacking order goes on it: a z-index on the popup inside is
 * inert, and the tooltip would sit under anything raised (a sidebar flyout).
 */
export const tooltipPositionerStyles = css({ zIndex: "tooltip" });
