/**
 * The sheet first game page, for players who play from the character sheet
 * and take few notes, from Iron Fellowship's character sheet. See
 * PlayLayouts.tsx for what it holds. (The dashboard and moves first
 * proposals were dropped once sheet first was chosen.)
 *
 * Each story sets the viewport: desktop at 1440 x 900 (1280 x 800 and
 * 1600 x 900 are in the toolbar), tablet at 820 x 1180, which the toolbar's
 * rotate button turns into 1180 x 820 landscape. The layouts follow the
 * width of the column they sit in, so dragging a sidebar's edge shows the
 * same reflow. Tablet stories size steppers for fingers, as the app would
 * on a coarse pointer.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PhoneGamePage } from "./PhoneGamePage";
import { SheetFirstPage } from "./PlayLayouts";
import { responsiveViewports, useGamePageTier } from "./responsiveViewports";

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
  ...responsiveViewports,
};

const meta: Meta = {
  title: "Examples/Play layouts",
  parameters: {
    layout: "fullscreen",
    viewport: { options: viewports },
    docs: {
      description: {
        component:
          "The game page for players who mostly play from the character sheet and seldom write notes. The notes are one press away, in the sheet's last tab, but never take the main column.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

const sheetFirstDescription =
  "Iron Fellowship's character sheet, reskinned for players who live on their stats and assets: the sheet is the main column, with the character, the stats and the meters in a band at the top, and the rest in one tabbed card that fills the height and scrolls inside, so marking a track never loses your place in a note. Moves, Oracles and the Game Log share a sidebar, and notes are simply the card's last tab.";

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
 * Sheet first on a tablet. The reference is a rail of Moves, Oracles and
 * Game Log; each opens the column over the sheet, and it can't be kept
 * open, so the sheet always has the width. Rotate for landscape.
 */
export const SheetFirstTablet: Story = {
  name: "Sheet first, tablet",
  globals: tablet,
  parameters: {
    docs: {
      description: {
        story: `${sheetFirstDescription} On a tablet the reference stays on its rail so the sheet gets the width: a rail button opens it over the sheet, with no Expand or Keep Open.`,
      },
    },
  },
  render: () => <SheetFirstPage touch sidebarPinnable={false} />,
};

function ResponsiveSheetFirst() {
  const tier = useGamePageTier();
  if (tier === "phone") return <PhoneGamePage />;
  // Below 1200px the reference stays on its rail; above it, it is as the
  // reader left it.
  return <SheetFirstPage sidebarPinnable={tier !== "medium"} />;
}

/**
 * Sheet first at every width: the reference open beside the sheet from
 * 1200px, held on its rail from 900px (a rail button opens it over the
 * sheet, and it can't be kept open there), and below 900px the phone page, which already opens on the sheet
 * with the notes a tab away. Step through the toolbar's viewports, from
 * 1600 down to 390, or resize the window with the canvas open on its own.
 */
export const SheetFirstResponsive: Story = {
  name: "Sheet first, responsive",
  globals: { viewport: { value: "r1440", isRotated: false } },
  render: () => <ResponsiveSheetFirst />,
};

/**
 * A long name, to see it wrap beside the portrait while the Adds chip and
 * the gear keep their place. Narrow the column (a tablet viewport, or drag
 * the reference's edge) and the chip drops under the name.
 */
export const SheetFirstLongName: Story = {
  name: "Sheet first, long name",
  globals: desktop,
  render: () => (
    <SheetFirstPage characterName="Captain Isolde Varn-Thessaly of the Ninth Drowned Reach" />
  ),
};
