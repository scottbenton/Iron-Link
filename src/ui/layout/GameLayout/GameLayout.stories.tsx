import { BookOpenIcon, PlusIcon, UserIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Alert } from "../../components/Alert";
import { IconButton } from "../../components/IconButton";
import {
  CharacterSheetPlaceholder,
  GamePageTabs,
  NotesPlaceholder,
  PhoneFrame,
  ReferencePlaceholder,
} from "../Examples/StoryPlaceholders";
import { LayoutPanel } from "../shared/layoutPanel";
import { GameLayout } from "./GameLayout";

const character: LayoutPanel = {
  id: "character",
  title: "Character",
  icon: <UserIcon />,
  content: <CharacterSheetPlaceholder />,
};
const reference: LayoutPanel = {
  id: "reference",
  title: "Reference",
  icon: <BookOpenIcon />,
  content: <ReferencePlaceholder />,
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
      actions: (
        <IconButton label="Add Note" size="sm">
          <PlusIcon />
        </IconButton>
      ),
      content: <NotesPlaceholder />,
    },
    startSidebar: { panels: [character, reference] },
    compact: false,
  },
};

export default meta;
type Story = StoryObj<typeof GameLayout>;

// GameLayout fills its parent; the app gives it AppShell's `fill` main.
const frame = css({ height: "680px" });

/**
 * Page tabs over the main column and a sidebar. Each column has its own h2
 * and scrolls on its own.
 */
export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <GameLayout {...args} />
    </div>
  ),
};

/** The sheet on one side and the reference on the other. */
export const TwoSidebars: Story = {
  ...Playground,
  args: {
    startSidebar: { panels: [character] },
    endSidebar: { panels: [reference], defaultWidth: 320 },
  },
};

/** A notice over the tabs. */
export const WithBanner: Story = {
  ...Playground,
  args: {
    banner: (
      <Alert tone="info">Worlds are in beta. Tell us what you think.</Alert>
    ),
  },
};

/** On a phone every column is a full screen section behind tabs. */
export const Compact: Story = {
  parameters: { layout: "padded" },
  args: { compact: true },
  render: (args) => (
    <PhoneFrame>
      <GameLayout {...args} />
    </PhoneFrame>
  ),
};
