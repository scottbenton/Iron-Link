import { ReactNode } from "react";

/**
 * A part of a column behind its own tabs, such as the character sheet's
 * Assets. A collapsed sidebar lists its panels' sections in the rail.
 */
export interface LayoutSection {
  /** The tab's value in the column. */
  id: string;
  /** The rail button's name and tooltip. */
  title: string;
  /** The rail button's icon. */
  icon: ReactNode;
}

/**
 * One column's content on the game page: the character sheet, the
 * reference, the notes. Its title is the column's h2.
 */
export interface LayoutPanel {
  /** Stable key, also the tab's value. */
  id: string;
  /** The column's h2, and its tab's label where panels share a column. */
  title: string;
  /** Shown in a collapsed sidebar's rail. */
  icon?: ReactNode;
  /** Buttons in the column's header while it shows, such as a menu. */
  actions?: ReactNode;
  content: ReactNode;
  /**
   * The column's own tabs, when it has them. A collapsed sidebar shows one
   * rail button per section; pressing one calls `onActiveSectionChange`
   * and shows the column over the page until the reader is done.
   */
  sections?: LayoutSection[];
  /** The section the column is showing, to mark its rail button. */
  activeSectionId?: string;
  onActiveSectionChange?: (sectionId: string) => void;
  /**
   * An id for the h2, which takes `tabIndex={-1}` so a keyboard shortcut
   * can move focus to the column.
   */
  headingId?: string;
}
