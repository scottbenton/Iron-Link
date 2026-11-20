/** Props the game page's columns share for their own tabs. */
export interface ColumnTabsProps {
  /** The tab showing. Uncontrolled without it. */
  section?: string;
  onSectionChange?: (section: string) => void;
}
