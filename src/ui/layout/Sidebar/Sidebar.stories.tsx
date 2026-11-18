import { BookOpenIcon, UserIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { css } from "styled-system/css";
import { Flex, Stack } from "styled-system/jsx";

import { Text } from "../../components/Text";
import {
  CharacterSheetPlaceholder,
  ReferencePlaceholder,
} from "../Examples/StoryPlaceholders";
import { LayoutPanel } from "../shared/layoutPanel";
import { Sidebar, SidebarProps } from "./Sidebar";

const panels: LayoutPanel[] = [
  {
    id: "character",
    title: "Character",
    icon: <UserIcon />,
    content: <CharacterSheetPlaceholder />,
  },
  {
    id: "reference",
    title: "Reference",
    icon: <BookOpenIcon />,
    content: <ReferencePlaceholder />,
  },
];

const meta: Meta<typeof Sidebar> = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen" },
  args: {
    panels,
    side: "start",
    resizable: true,
    collapsible: true,
    minWidth: 280,
    maxWidth: 560,
    defaultWidth: 360,
  },
  argTypes: { side: { control: "inline-radio", options: ["start", "end"] } },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const frame = css({ height: "640px", background: "bg.surface" });

function Main() {
  return (
    <Stack flex="1" minWidth="0" padding="6" gap="2">
      <Text variant="h3" as="p">
        The main column
      </Text>
      <Text color="muted">
        Drag the sidebar's edge, or focus it and use the arrow keys. Enter or a
        long drag past the narrowest width collapses it; a double click resets
        it.
      </Text>
    </Stack>
  );
}

/** The app owns the width and collapsed state, so it can remember them. */
function ControlledSidebar(props: SidebarProps) {
  const [width, setWidth] = useState(props.defaultWidth ?? 360);
  const [collapsed, setCollapsed] = useState(props.collapsed ?? false);
  const sidebar = (
    <Sidebar
      {...props}
      width={width}
      onWidthChange={setWidth}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    />
  );
  return (
    <Flex className={frame}>
      {props.side === "end" ? (
        <>
          <Main />
          {sidebar}
        </>
      ) : (
        <>
          {sidebar}
          <Main />
        </>
      )}
    </Flex>
  );
}

/** The character sheet and the reference behind section tabs. */
export const Playground: Story = {
  render: (args) => <ControlledSidebar {...args} />,
};

/** Collapsed to a rail: each button opens the sidebar on its panel. */
export const Collapsed: Story = { ...Playground, args: { collapsed: true } };

/** One panel: its title is a visible heading instead of a tab. */
export const SinglePanel: Story = {
  ...Playground,
  args: { panels: [panels[1]], side: "end" },
};

/** A fixed column: no handle and no collapse button. */
export const Fixed: Story = {
  ...Playground,
  args: { resizable: false, collapsible: false },
};
