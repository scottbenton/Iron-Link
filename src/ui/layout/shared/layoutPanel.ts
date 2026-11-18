import { ReactNode } from "react";

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
   * An id for the h2, which takes `tabIndex={-1}` so a keyboard shortcut
   * can move focus to the column.
   */
  headingId?: string;
}
