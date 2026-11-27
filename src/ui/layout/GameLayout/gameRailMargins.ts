import { css } from "styled-system/css";

import { PageWidth } from "../shared/contentRail";

/**
 * Once the window is wider than the rail, the margins beside a game page are
 * the nav rail's gray-950 in both modes, so the page reads as one sheet in
 * the rail's dark frame. One literal per rail width, since Panda reads them
 * at build time.
 */
export const gameRailMarginStyles: Record<PageWidth, string> = {
  xs: css({ "@media (min-width: 481px)": { background: "gray.950" } }),
  sm: css({ "@media (min-width: 641px)": { background: "gray.950" } }),
  md: css({ "@media (min-width: 961px)": { background: "gray.950" } }),
  xl: css({ "@media (min-width: 1441px)": { background: "gray.950" } }),
};

/**
 * Side borders on the page past the same widths, so the sidebars' darker
 * wells stop at a line rather than spilling into the margins in dark mode.
 */
export const gameRailFrameStyles: Record<PageWidth, string> = {
  xs: css({
    "@media (min-width: 481px)": {
      borderInline: "1px solid token(colors.border.default)",
    },
  }),
  sm: css({
    "@media (min-width: 641px)": {
      borderInline: "1px solid token(colors.border.default)",
    },
  }),
  md: css({
    "@media (min-width: 961px)": {
      borderInline: "1px solid token(colors.border.default)",
    },
  }),
  xl: css({
    "@media (min-width: 1441px)": {
      borderInline: "1px solid token(colors.border.default)",
    },
  }),
};
