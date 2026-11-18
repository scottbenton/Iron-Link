/**
 * The game page with both sidebars collapsed. Each rail lists its column's
 * own tabs (Overview, Assets and Tracks; Moves, Oracles and Game Log) as
 * icon buttons with tooltips. A rail button shows that tab over the page,
 * beside the rail, without opening the sidebar: Escape, a press on the
 * page or moving focus out closes it, and focus goes back to the button.
 * Expand, at the top of the rail, or Keep Sidebar Open in the column's
 * header puts the sidebar back in place.
 *
 * At medium widths (900 to 1200px), where the sheet sits over the reference
 * in one column, that column collapses the same way: one rail with the
 * character's tabs, a divider, then the reference's, and a rail button shows
 * just that column over the notes.
 */
import { GearSixIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within } from "storybook/test";

import { css } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { AppShell } from "../AppShell";
import { GameLayout } from "../GameLayout";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { LayoutPanel } from "../shared/layoutPanel";
import {
  CharacterColumn,
  CharacterColumnActions,
  NotesColumn,
  ReferenceColumn,
} from "./GamePageColumns";
import { GamePageTabs } from "./StoryPlaceholders";
import { characterSections, referenceSections } from "./columnSections";
import { getNavItems } from "./storyData";

const meta: Meta = {
  title: "Layout/Examples/Game page, collapsed sidebars",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function CollapsedGamePage(props: { stacked?: boolean }) {
  const { stacked = false } = props;
  // The app keeps these, so a column opens on the tab the reader last used.
  const [sheetSection, setSheetSection] = useState("overview");
  const [referenceSection, setReferenceSection] = useState("moves");
  const [sheetCollapsed, setSheetCollapsed] = useState(true);
  const [referenceCollapsed, setReferenceCollapsed] = useState(true);
  const [sheetWidth, setSheetWidth] = useState(350);
  const [referenceWidth, setReferenceWidth] = useState(350);
  const [stackedCollapsed, setStackedCollapsed] = useState(true);

  const character: LayoutPanel = {
    id: "character",
    title: "Character",
    actions: <CharacterColumnActions />,
    sections: characterSections,
    activeSectionId: sheetSection,
    onActiveSectionChange: setSheetSection,
    content: (
      <CharacterColumn
        section={sheetSection}
        onSectionChange={setSheetSection}
      />
    ),
  };
  const reference: LayoutPanel = {
    id: "reference",
    title: "Reference",
    sections: referenceSections,
    activeSectionId: referenceSection,
    onActiveSectionChange: setReferenceSection,
    content: (
      <ReferenceColumn
        section={referenceSection}
        onSectionChange={setReferenceSection}
      />
    ),
  };

  return (
    <AppShell
      fill
      rail={
        <NavRail
          items={getNavItems("games")}
          homeHref="#games"
          actions={
            <IconButton label="App Settings" tooltipSide="right">
              <GearSixIcon />
            </IconButton>
          }
        />
      }
      topBar={<NavBar title="Kira Vale" backHref="#overview" />}
    >
      <GameLayout
        tabs={<GamePageTabs current="kira" />}
        stackSidebars={stacked}
        stackedCollapsed={stackedCollapsed}
        onStackedCollapsedChange={setStackedCollapsed}
        main={{
          id: "notes",
          title: "Notes",
          hideTitle: true,
          content: <NotesColumn />,
        }}
        startSidebar={{
          panels: [character],
          collapsed: sheetCollapsed,
          onCollapsedChange: setSheetCollapsed,
          width: sheetWidth,
          onWidthChange: setSheetWidth,
          labels: {
            expand: "Expand Character Sidebar",
            collapse: "Collapse Character Sidebar",
            dock: "Keep Character Sidebar Open",
          },
        }}
        endSidebar={{
          panels: [reference],
          collapsed: referenceCollapsed,
          onCollapsedChange: setReferenceCollapsed,
          width: referenceWidth,
          onWidthChange: setReferenceWidth,
          labels: {
            expand: "Expand Reference Sidebar",
            collapse: "Collapse Reference Sidebar",
            dock: "Keep Reference Sidebar Open",
          },
        }}
      />
    </AppShell>
  );
}

/**
 * Both sidebars collapsed to rails, the notes taking the width. Hover or
 * focus a rail button for its name; press one to see that tab.
 */
export const BothCollapsed: Story = {
  name: "Both collapsed",
  render: () => <CollapsedGamePage />,
};

/**
 * Assets pressed in the character rail: the column shows over the notes at
 * its usual width, with Keep Sidebar Open and Close in its header. Press
 * Tracks in the rail to switch, Escape to close.
 */
export const OverlayOpen: Story = {
  name: "Overlay open (Assets)",
  render: () => <CollapsedGamePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Assets" }));
  },
};

/** Oracles pressed in the reference rail: the column opens to its left. */
export const ReferenceOverlayOpen: Story = {
  name: "Overlay open (Oracles)",
  render: () => <CollapsedGamePage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Oracles" }));
  },
};

const mediumFrame = css({
  width: "1100px",
  maxWidth: "100%",
  height: "760px",
  marginInline: "auto",
  border: "1px solid token(colors.border.default)",
  overflow: "hidden",
  "--app-shell-height": "100%",
});

/**
 * Medium (1100px): the stacked column collapsed to one rail, the
 * character's tabs, then the reference's. Expand puts the sheet over the
 * reference again.
 */
export const MediumCollapsed: Story = {
  name: "Medium, collapsed",
  parameters: { layout: "padded" },
  render: () => (
    <div className={mediumFrame}>
      <CollapsedGamePage stacked />
    </div>
  ),
};

/**
 * Medium, Oracles pressed in the rail: only the reference shows over the
 * notes, at the column's width (never wider than the room beside the
 * rail), with Keep Sidebar Open and Close in its header. Press Assets to
 * switch to the sheet; Keep Sidebar Open docks the whole column.
 */
export const MediumOverlayOpen: Story = {
  name: "Medium, overlay open (Oracles)",
  parameters: { layout: "padded" },
  render: () => (
    <div className={mediumFrame}>
      <CollapsedGamePage stacked />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Oracles" }));
  },
};
