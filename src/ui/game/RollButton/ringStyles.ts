import type { SystemStyleObject } from "styled-system/types";

/**
 * The gradient ring shared by roll buttons and stat cards. The ring is the
 * element's ::before, a spinning gradient larger than the element and clipped
 * by it (overflow hidden), showing through the element's padding around an
 * inner layer. Because the ring is a child of the moving element, it travels
 * with it on press.
 */
export const ringLayer: SystemStyleObject = {
  content: '""',
  position: "absolute",
  zIndex: -1,
  left: "50%",
  top: "50%",
  width: "150%",
  minHeight: "150%",
  aspectRatio: "1",
  translate: "-50% -50%",
  backgroundImage: "var(--gradients-ring)",
  animation: "ringSpin var(--durations-ring-spin) linear infinite",
  transition:
    "opacity var(--durations-fast) linear, filter var(--durations-fast) linear",
  pointerEvents: "none",
};

/** The page asks for the Draw reveal. */
export const drawReveal = ":root[data-ring-reveal=draw] &";
/** The page asks for the Thicken reveal. */
export const thickenReveal = ":root[data-ring-reveal=thicken] &";
/** Fade is the default, so it applies unless another reveal is asked for. */
export const fadeReveal =
  ":root:not([data-ring-reveal=draw]):not([data-ring-reveal=thicken]) &";

/**
 * States that show a stat card's hidden ring: press and keyboard focus
 * everywhere, hover only where a real pointer hovers, so a tap on a phone
 * never leaves it behind.
 */
export const ringShown = "&:is(:active, [data-pressed], :focus-visible)";
export const ringHovered = "&:hover:not(:disabled, [data-disabled])";
