/**
 * Game page layouts for players who play from the character sheet and take
 * few notes, starting from Iron Fellowship's character sheet. See
 * PlayLayouts.tsx for what each proposal holds.
 *
 * Each story sets the viewport: desktop at 1440 x 900 (1280 x 800 and
 * 1600 x 900 are in the toolbar), tablet at 820 x 1180, which the toolbar's
 * rotate button turns into 1180 x 820 landscape. The layouts follow the
 * width of the column they sit in, so dragging a sidebar's edge shows the
 * same reflow. Tablet stories size steppers for fingers, as the app would
 * on a coarse pointer.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DashboardPage, MovesFirstPage, SheetFirstPage } from "./PlayLayouts";

const viewports = {
  desktopSmall: {
    name: "Desktop (1280 x 800)",
    styles: { width: "1280px", height: "800px" },
    type: "desktop",
  },
  desktop: {
    name: "Desktop (1440 x 900)",
    styles: { width: "1440px", height: "900px" },
    type: "desktop",
  },
  desktopLarge: {
    name: "Desktop (1600 x 900)",
    styles: { width: "1600px", height: "900px" },
    type: "desktop",
  },
  tablet: {
    name: "Tablet (820 x 1180, rotate for 1180 x 820)",
    styles: { width: "820px", height: "1180px" },
    type: "tablet",
  },
};

const meta: Meta = {
  title: "Layout/Examples/Play layouts",
  parameters: {
    layout: "fullscreen",
    viewport: { options: viewports },
    docs: {
      description: {
        component:
          "Three game pages for players who mostly play from the character sheet and seldom write notes. Each keeps the notes one press away, but none gives them the main column.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

const sheetFirstDescription =
  "Iron Fellowship's character sheet, reskinned for players who live on their stats and assets: the sheet is the main column, with the character and stats in a band, the meters under it and the rest behind tabs. Moves, Oracles and the Game Log share a sidebar, so only one of them and one sheet tab show at a time, and notes are simply the sheet's last tab.";

const dashboardDescription =
  "Everything on the sheet at once for players who glance at the whole character between rolls: tiles flow into as many 300px columns as fit, and the game log is docked at the end so the table's rolls stay in view. The cost is that moves, oracles and notes live in drawers opened from the toolbar above the tiles.";

const movesFirstDescription =
  "For players who drive play through moves: a compact strip of the character (stats and meters, what a move rolls) sits over a wide reference, the move list beside the open move and its latest rolls. Assets, tracks and legacy drop to a sidebar, whose last tabs are the Game Log and the notes.";

/** Iron Fellowship style, at 1440px: the reference is the start sidebar. */
export const SheetFirstDesktop: Story = {
  name: "Sheet first, desktop",
  globals: desktop,
  parameters: {
    docs: {
      description: {
        story: `${sheetFirstDescription} At 1440px the reference stays open beside the sheet.`,
      },
    },
  },
  render: () => <SheetFirstPage />,
};

/**
 * Sheet first on a tablet. The reference starts as a rail of Moves, Oracles
 * and Game Log; each opens the column over the sheet. Rotate for landscape.
 */
export const SheetFirstTablet: Story = {
  name: "Sheet first, tablet",
  globals: tablet,
  parameters: {
    docs: {
      description: {
        story: `${sheetFirstDescription} On a tablet the reference starts folded to its rail so the sheet gets the width, and a rail button opens it over the sheet.`,
      },
    },
  },
  render: () => <SheetFirstPage touch sidebarCollapsed />,
};

/** The dashboard at 1440px: three columns of tiles beside the log. */
export const DashboardDesktop: Story = {
  name: "Dashboard, desktop",
  globals: desktop,
  parameters: {
    docs: {
      description: {
        story: `${dashboardDescription} At 1440px the tiles run three across beside the log.`,
      },
    },
  },
  render: () => <DashboardPage />,
};

/**
 * The dashboard on a tablet: one column of tiles beside a narrower log in
 * portrait, two in landscape.
 */
export const DashboardTablet: Story = {
  name: "Dashboard, tablet",
  globals: tablet,
  parameters: {
    docs: {
      description: {
        story: `${dashboardDescription} On a tablet the log narrows to 300px and the tiles fall to one column in portrait and two in landscape.`,
      },
    },
  },
  render: () => <DashboardPage touch />,
};

/** Moves first at 1440px: the sheet's other parts in the end sidebar. */
export const MovesFirstDesktop: Story = {
  name: "Moves first, desktop",
  globals: desktop,
  parameters: {
    docs: {
      description: {
        story: `${movesFirstDescription} At 1440px the strip takes two rows and the list and move sit side by side.`,
      },
    },
  },
  render: () => <MovesFirstPage />,
};

/**
 * Moves first on a tablet: the sidebar starts as a rail, so the move list
 * and the open move sit side by side.
 */
export const MovesFirstTablet: Story = {
  name: "Moves first, tablet",
  globals: tablet,
  parameters: {
    docs: {
      description: {
        story: `${movesFirstDescription} On a tablet the sidebar starts folded to its rail, so the list and the open move still fit side by side in portrait.`,
      },
    },
  },
  render: () => <MovesFirstPage touch sidebarCollapsed />,
};
