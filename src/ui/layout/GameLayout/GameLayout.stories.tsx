import { BookOpenIcon, UserIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";

import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import {
  CharacterColumn,
  CharacterColumnActions,
  NotesColumn,
  ReferenceColumn,
} from "../Examples/GamePageColumns";
import { GamePageTabs } from "../Examples/StoryPlaceholders";
import { LayoutPanel } from "../shared/layoutPanel";
import { GameLayout } from "./GameLayout";

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
      <GameLayout {...args} />
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
 * Between 900 and 1200px the sheet sits over the reference in one column
 * beside the notes, as the live app lays it out, while both are open. The
 * column keeps the sheet's resize handle. Each has its own Collapse:
 * collapse the reference and the sheet stays open as its own column, with
 * the reference on a rail at the far side (and the other way round).
 */
export const Stacked: Story = {
  args: { stackSidebars: true },
  parameters: { layout: "padded" },
  render: (args) => (
    <div className={mediumFrame}>
      <GameLayout {...args} />
    </div>
  ),
};

function ReferenceOnRail(props: { args: Story["args"] }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className={mediumFrame}>
      <GameLayout
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
 * a rail: a rail button shows a reference section over the notes for a
 * moment, and Expand stacks the two again.
 */
export const StackedReferenceCollapsed: Story = {
  args: { stackSidebars: true },
  parameters: { layout: "padded" },
  render: (args) => <ReferenceOnRail args={args} />,
};
