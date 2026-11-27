import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { SectionTabsAlign } from "./sectionTabsTypes";

const tabWellStyles = css({
  display: "grid",
  // The end column never squeezes its controls; when it outgrows its half
  // the tab list narrows and scrolls.
  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, auto) minmax(max-content, 1fr)",
  alignItems: "center",
  background: "bg.canvas",
  borderBottom: "1px solid token(colors.border.default)",
  "& > [role=tablist]": { gridColumn: "2" },
  // At the start: no space before the tabs, the end column takes the rest.
  "&[data-align=start]": {
    gridTemplateColumns: "0 minmax(0, auto) minmax(max-content, 1fr)",
  },
  "& > [data-section-tab-well-end]": {
    gridColumn: "3",
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    paddingInlineEnd: "1.5",
    paddingBottom: "var(--border-widths-ledge)",
    "&:empty": { display: "none" },
  },
});

export interface SectionTabWellProps {
  /** A well `SectionTabList`. */
  children: ReactNode;
  /**
   * Controls at the end of the band, beside the tabs but outside the tab
   * list, such as a column's menu and Collapse (`SidebarHeaderEnd`).
   */
  end?: ReactNode;
  /**
   * Centred across the band (the default) or at its start; give the
   * `SectionTabList` inside the same `align`.
   */
  align?: SectionTabsAlign;
  className?: string;
}

/**
 * The well's band with room for controls: the tabs centred across the whole
 * band and `end` at its inline end, outside the tab list so the list holds
 * only tabs. Without `end`, a well `SectionTabList` alone is the same band.
 */
export function SectionTabWell(props: SectionTabWellProps) {
  const { children, end, align = "center", className } = props;
  return (
    <div
      className={cx(tabWellStyles, className)}
      data-section-tab-well=""
      data-align={align}
    >
      {children}
      <div data-section-tab-well-end="">{end}</div>
    </div>
  );
}
