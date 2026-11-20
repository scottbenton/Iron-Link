import { BookOpenIcon, UserIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import {
  CharacterColumn,
  CharacterColumnActions,
  NotesColumn,
  ReferenceColumn,
} from "../../Examples/GamePageColumns";
import { GamePageTabs } from "../../Examples/StoryPlaceholders";
import {
  characterSections,
  referenceSections,
} from "../../Examples/columnSections";
import { LayoutPanel } from "../../shared/layoutPanel";
import { GameLayout, GameLayoutProps } from "../GameLayout";

const character: LayoutPanel = {
  id: "character",
  title: "Character",
  icon: <UserIcon />,
  actions: <CharacterColumnActions />,
  content: <CharacterColumn />,
};
const reference: LayoutPanel = {
  id: "reference",
  title: "Reference",
  icon: <BookOpenIcon />,
  content: <ReferenceColumn />,
};

/**
 * GameLayout with the columns' own tabs wired up, so a collapsed sidebar's
 * rail shows a button per tab (Overview, Assets, Tracks; Moves, Oracles,
 * Game Log) and the rail and the column share the open tab, as the app does.
 */
function SectionedGameLayout(props: GameLayoutProps) {
  const [sheetSection, setSheetSection] = useState("overview");
  const [referenceSection, setReferenceSection] = useState("moves");
  const withSections = (panel: LayoutPanel): LayoutPanel => {
    if (panel.id === character.id) {
      return {
        ...panel,
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
    }
    if (panel.id === reference.id) {
      return {
        ...panel,
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
    }
    return panel;
  };
  const { startSidebar, endSidebar } = props;
  return (
    <GameLayout
      {...props}
      startSidebar={
        startSidebar && {
          ...startSidebar,
          panels: startSidebar.panels.map(withSections),
        }
      }
      endSidebar={
        endSidebar && {
          ...endSidebar,
          panels: endSidebar.panels.map(withSections),
        }
      }
    />
  );
}

const meta: Meta<typeof GameLayout> = {
  title: "Layout/GameLayout",
  component: GameLayout,
  parameters: { layout: "fullscreen" },
  args: {
    tabs: <GamePageTabs current="kira" />,
    main: {
      id: "notes",
      title: "Notes",
      hideTitle: true,
      content: <NotesColumn />,
    },
    startSidebar: { panels: [character], defaultWidth: 350 },
    endSidebar: { panels: [reference], defaultWidth: 350 },
    stackSidebars: false,
  },
};

export default meta;
type Story = StoryObj<typeof GameLayout>;

// GameLayout fills its parent; the app gives it AppShell's `fill` main.
const frame = css({ height: "720px" });

/**
 * The live arrangement: the character sheet, the notes and the reference
 * side by side under the game's tabs. Each column has its own h2 and
 * scrolls on its own; the sidebars resize and collapse.
 */
export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <SectionedGameLayout {...args} />
    </div>
  ),
};

/**
 * The Worlds beta banner over the tabs, as live: edge to edge, with no
 * radius and no side borders, so it fits the page rather than floating.
 */
export const WithBanner: Story = {
  ...Playground,
  args: {
    banner: (
      <Alert
        tone="info"
        title="This game has a world"
        action={
          <Button size="sm" variant="ghost">
            Turn on the beta
          </Button>
        }
        onClose={() => {}}
        closeLabel="Dismiss"
      >
        Turn on the Worlds beta to see it in your notes. You can turn it off
        again in Advanced Features.
      </Alert>
    ),
  },
};

const mediumFrame = css({
  width: "1100px",
  maxWidth: "100%",
  height: "720px",
  border: "1px solid token(colors.border.default)",
});

/**
 * Between 900 and 1200px both sidebars sit before the notes. While both are
 * open the sheet sits over the reference in one column, with the sheet's
 * resize handle. Each has its own Collapse: collapse the reference and its
 * rail sits first, then the sheet open beside the notes, the rail taking its
 * width from the notes rather than the sheet (and the other way round). With
 * both collapsed they share one rail.
 */
export const Stacked: Story = {
  args: { stackSidebars: true },
  parameters: { layout: "padded" },
  render: (args) => (
    <div className={mediumFrame}>
      <SectionedGameLayout {...args} />
    </div>
  ),
};

function ReferenceOnRail(props: { args: Story["args"] }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className={mediumFrame}>
      <SectionedGameLayout
        {...props.args}
        main={meta.args!.main!}
        endSidebar={{
          panels: [reference],
          defaultWidth: 350,
          collapsed,
          onCollapsedChange: setCollapsed,
        }}
      />
    </div>
  );
}

/**
 * The medium width with the sheet kept open and the reference collapsed to
 * a rail before it, so the sheet stays beside the notes and the rail comes
 * out of the notes' width: a rail button shows a reference section over the
 * page for a moment, and Expand stacks the two again.
 */
export const StackedReferenceCollapsed: Story = {
  args: { stackSidebars: true },
  parameters: { layout: "padded" },
  render: (args) => <ReferenceOnRail args={args} />,
};

function BothOnRails(props: { args: Story["args"] }) {
  const [sheetCollapsed, setSheetCollapsed] = useState(true);
  const [referenceCollapsed, setReferenceCollapsed] = useState(true);
  return (
    <div className={mediumFrame}>
      <SectionedGameLayout
        {...props.args}
        main={meta.args!.main!}
        startSidebar={{
          ...meta.args!.startSidebar!,
          collapsed: sheetCollapsed,
          onCollapsedChange: setSheetCollapsed,
        }}
        endSidebar={{
          panels: [reference],
          defaultWidth: 350,
          collapsed: referenceCollapsed,
          onCollapsedChange: setReferenceCollapsed,
        }}
      />
    </div>
  );
}

/**
 * The medium width with both sidebars collapsed into one rail before the
 * notes, which take the rest: the sheet's Expand and sections, then the
 * reference's, each in its own group. Expand either to pin it open.
 */
export const StackedBothCollapsed: Story = {
  args: { stackSidebars: true },
  parameters: { layout: "padded" },
  render: (args) => <BothOnRails args={args} />,
};
