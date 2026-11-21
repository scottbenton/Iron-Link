import { surfaceStyles } from "ui/components/Surface";

import { css, cx } from "styled-system/css";

/**
 * The flat card the game content sits on: the flat `Surface` (the surface
 * colour, a hairline border, the card radius) laid out as a column. No
 * ledge, since the card itself is not pressed; a card the reader presses is
 * the library `Card` with an action area or overlay.
 */
export const contentCardStyles = cx(
  surfaceStyles({ tone: "flat", radius: "lg" }),
  css({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    fontFamily: "body",
  }),
);

/** Height animation for a Base UI Collapsible panel. */
export const collapsiblePanelStyles = css({
  overflow: "hidden",
  height: "var(--collapsible-panel-height)",
  transitionProperty: "height, opacity",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  _startingStyle: { height: 0, opacity: 0 },
  _endingStyle: {
    height: 0,
    opacity: 0,
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  _reducedMotion: { transitionDuration: "0s" },
});

/** The chevron that turns when its disclosure opens. */
export const disclosureChevronStyles = css({
  flex: "none",
  width: "1.1em",
  height: "1.1em",
  transitionProperty: "rotate",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  "[data-panel-open] > &, [aria-expanded=true] > &": { rotate: "180deg" },
  _reducedMotion: { transitionDuration: "0s" },
});
