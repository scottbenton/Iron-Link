import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { PageWidth, contentRailStyles } from "../shared/contentRail";
import { gameRailFrameStyles, gameRailMarginStyles } from "./gameRailMargins";

const rootStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
  minWidth: 0,
});

const sheetStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
  minWidth: 0,
  background: "bg.surface",
});

export interface GamePageFrameProps {
  /** The game's page tabs, as GameLayout takes them. */
  tabs?: ReactNode;
  /** The page itself, such as a `PageContent` at its own reading width. */
  children: ReactNode;
  /** The sheet's width, as GameLayout's: xl (1440px) by default. */
  maxWidth?: PageWidth;
  className?: string;
}

/**
 * A game page that scrolls as a whole, such as adding a character: the
 * game's tabs and the page on one sheet of GameLayout's width, bordered,
 * with its dark margins beyond. The content inside keeps its own width.
 */
export function GamePageFrame(props: GamePageFrameProps) {
  const { tabs, children, maxWidth = "xl", className } = props;
  return (
    <div className={cx(rootStyles, gameRailMarginStyles[maxWidth], className)}>
      <div
        className={cx(
          contentRailStyles({ maxWidth }),
          sheetStyles,
          gameRailFrameStyles[maxWidth],
        )}
      >
        {tabs}
        {children}
      </div>
    </div>
  );
}
