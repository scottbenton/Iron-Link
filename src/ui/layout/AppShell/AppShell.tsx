import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { SkipLink } from "../SkipLink";
import { MAIN_CONTENT_ID } from "../shared/shell";

const shellStyles = css({
  boxSizing: "border-box",
  // The layout's breakpoints read this container (see shared/shell.ts).
  containerType: "inline-size",
  containerName: "shell",
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  minHeight: "var(--app-shell-height, 100dvh)",
  background: "bg.canvas",
  color: "fg.default",
  fontFamily: "body",
});

/**
 * The grid switches on the shell's own width, which a container cannot
 * query, so it sits one level in.
 */
const frameStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  minHeight: "inherit",
  "@container shell (min-width: 900px)": {
    gridTemplateColumns: "auto minmax(0, 1fr)",
  },
});

const fillStyles = css({
  height: "var(--app-shell-height, 100dvh)",
  "& [data-part=frame]": { height: "100%" },
  "& [data-part=column]": { height: "100%", minHeight: 0 },
  "& [data-part=main]": { minHeight: 0, overflow: "auto" },
});

const railSlotStyles = css({
  display: "none",
  "@container shell (min-width: 900px)": { display: "block" },
});

const columnStyles = css({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: "inherit",
});

const mainStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minWidth: 0,
  background: "bg.surface",
  outline: "none",
});

const bottomSlotStyles = css({
  position: "sticky",
  bottom: 0,
  zIndex: "sticky",
  flex: "none",
  "@container shell (min-width: 900px)": { display: "none" },
});

export interface AppShellProps {
  /** The NavRail, shown on wide screens (900px and up). */
  rail?: ReactNode;
  /**
   * The NavBar. It renders inside `<main>`, so the page's h1 in it is where
   * route focus lands.
   */
  topBar?: ReactNode;
  /** The MobileNav bottom bar, shown on phones (below 900px). */
  bottomNav?: ReactNode;
  /** The page. */
  children?: ReactNode;
  /**
   * Fill the screen exactly, with the page scrolling inside its own regions
   * (the game page's columns). Otherwise the document scrolls.
   */
  fill?: boolean;
  /** The id of `<main>`, the skip link's target. */
  mainId?: string;
  skipLinkLabel?: string;
  className?: string;
}

/**
 * The app's frame: a skip link, the NavRail beside the page on wide
 * screens, and the MobileNav under it on phones. The shell is a size
 * container named `shell` whose width drives every layout component inside
 * it, so the switch at 900px needs no script.
 *
 * Its height is `--app-shell-height` (100dvh by default); set the variable
 * to fit it in a frame.
 */
export function AppShell(props: AppShellProps) {
  const {
    rail,
    topBar,
    bottomNav,
    children,
    fill = false,
    mainId = MAIN_CONTENT_ID,
    skipLinkLabel,
    className,
  } = props;

  return (
    <div className={cx("ui-root", shellStyles, fill && fillStyles, className)}>
      <SkipLink targetId={mainId} label={skipLinkLabel} />
      <div className={frameStyles} data-part="frame">
        {rail && <div className={railSlotStyles}>{rail}</div>}
        <div className={columnStyles} data-part="column">
          <main
            id={mainId}
            // Lets the skip link and route focus move focus here.
            tabIndex={-1}
            className={mainStyles}
            data-part="main"
          >
            {topBar}
            {children}
          </main>
          {bottomNav && <div className={bottomSlotStyles}>{bottomNav}</div>}
        </div>
      </div>
    </div>
  );
}
