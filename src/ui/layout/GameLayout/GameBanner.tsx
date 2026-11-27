import { ReactNode } from "react";

import { css } from "styled-system/css";

/**
 * The banner runs edge to edge under the bar: no radius and no side or top
 * border, so it reads as part of the page rather than a card on it. The
 * attribute raises these over the Alert's own recipe.
 */
const bannerStyles = css({
  flex: "none",
  "&[data-part=banner] > *": {
    width: "100%",
    maxWidth: "none",
    marginInline: 0,
    borderRadius: 0,
    borderInlineWidth: 0,
    borderTopWidth: 0,
  },
});

export interface GameBannerProps {
  /** A notice such as the Worlds beta banner (an `Alert`). */
  children: ReactNode;
}

/**
 * Holds a notice across the top of a game page, edge to edge. GameLayout's
 * `banner` slot uses it; a page without GameLayout's columns (the phone
 * page, character creation) wraps its banner in it to match.
 */
export function GameBanner(props: GameBannerProps) {
  const { children } = props;
  return (
    <div className={bannerStyles} data-part="banner">
      {children}
    </div>
  );
}
