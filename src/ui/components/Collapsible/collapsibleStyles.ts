import { css } from "styled-system/css";

/**
 * The height animation for Collapsible and Collapse panels.
 * Base UI measures the content into `--collapsible-panel-height`, so the
 * panel grows and shrinks to fit. Under
 * reduced motion it opens at once.
 */
export const collapsiblePanelStyles = css({
  overflow: "hidden",
  boxSizing: "border-box",
  height: "var(--collapsible-panel-height)",
  transitionProperty: "height",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  _startingStyle: { height: 0 },
  _endingStyle: {
    height: 0,
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  "&[hidden]:not([hidden=until-found])": { display: "none" },
  _reducedMotion: { transitionDuration: "0s" },
});
