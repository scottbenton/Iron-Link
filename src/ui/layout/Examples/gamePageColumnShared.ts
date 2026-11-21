import { css } from "styled-system/css";

/** Tabs at the top of a column, with the panels under them. */
export const columnTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
});

/** Props the game page's columns share for their own tabs. */
export interface ColumnTabsProps {
  /** The tab showing. Uncontrolled without it. */
  section?: string;
  onSectionChange?: (section: string) => void;
}

export const sheetPanelStyles = css({
  paddingInline: "4",
  paddingBlockEnd: "6",
});
