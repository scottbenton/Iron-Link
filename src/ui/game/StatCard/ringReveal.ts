/**
 * Selectors for the stat card's ring. The page's `data-ring-reveal` picks how
 * the ring arrives (Fade by default, Draw or Thicken), and the ring shows only
 * while the card is pressed, focused from the keyboard or hovered.
 */
export const drawReveal = ":root[data-ring-reveal=draw] &";
export const thickenReveal = ":root[data-ring-reveal=thicken] &";
export const fadeReveal =
  ":root:not([data-ring-reveal=draw]):not([data-ring-reveal=thicken]) &";
export const ringShown = "&:is(:active, [data-pressed], :focus-visible)";
export const ringHovered = "&:hover:not(:disabled, [data-disabled])";
