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
