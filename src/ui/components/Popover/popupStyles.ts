import { css } from "styled-system/css";

/**
 * The floating card shared by menus, popovers and preview cards: the raised
 * surface with the popover shadow (its 1px ring is the border), entering
 * from the trigger with a short fade and scale and leaving faster.
 */
export const popupSurfaceStyles = css({
  boxSizing: "border-box",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "body",
  boxShadow: "popover",
  outline: "none",
  transformOrigin: "var(--transform-origin)",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _startingStyle: { opacity: 0, scale: "0.97" },
  _endingStyle: {
    opacity: 0,
    scale: "0.97",
    transitionDuration: "instant",
    transitionTimingFunction: "in",
  },
  "&[data-instant]": { transitionDuration: "0s" },
  _reducedMotion: {
    _startingStyle: { scale: "1" },
    _endingStyle: { scale: "1" },
  },
});

/** The positioner of a popup: above dialogs and drawers. */
export const popupPositionerStyles = css({
  zIndex: "popover",
  outline: "none",
});
