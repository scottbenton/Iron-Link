import { css } from "styled-system/css";

/**
 * The flat card the game content sits on: a surface, a hairline border and
 * the card radius. No ledge, since the card itself is not pressed; a card
 * that is one button (AssetPickerCard) adds its own.
 */
export const contentCardStyles = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
});

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
