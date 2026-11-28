// The side margin of everything in a Notes tab: breadcrumbs, the toolbar
// strip and the content below it. Each view's scroller spans the whole
// column, so its scrollbar sits at the column's edge, and pads inside.
// The rich text editor's `inset` pads its text by the same amount.
export const NOTES_PANE_GUTTER = { xs: 1, sm: 2 } as const;
