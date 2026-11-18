import { BookOpenIcon, UserIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Flex, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { CharacterColumn } from "../Examples/GamePageColumns";
import {
  CharacterSheetPlaceholder,
  ReferencePlaceholder,
} from "../Examples/StoryPlaceholders";
import { characterSections } from "../Examples/columnSections";
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
    panels: [panels[0]],
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

/**
 * The character sheet as the game page's start column: its title is the
 * column's h2.
 */
export const Playground: Story = {
  render: (args) => <ControlledSidebar {...args} />,
};

/**
 * Collapsed to a rail. A panel's button shows it over the main column for
 * a moment (Escape or a press outside closes it); Expand, at the top,
 * opens the sidebar in place.
 */
export const Collapsed: Story = { ...Playground, args: { collapsed: true } };

/** The character sheet with its tab kept by the app, as the game page does. */
function SectionedSidebar(props: SidebarProps) {
  const [section, setSection] = useState("assets");
  return (
    <ControlledSidebar
      {...props}
      panels={[
        {
          id: "character",
          title: "Character",
          sections: characterSections,
          activeSectionId: section,
          onActiveSectionChange: setSection,
          content: (
            <CharacterColumn section={section} onSectionChange={setSection} />
          ),
        },
      ]}
    />
  );
}

/**
 * A panel with its own tabs: the rail shows a button per tab (Overview,
 * Assets, Tracks) instead of one for the panel. Each opens the sheet on
 * that tab over the main column; Keep Sidebar Open in its header, or
 * Expand, docks it again.
 */
export const CollapsedWithSections: Story = {
  name: "Collapsed, with sections",
  render: (args) => <SectionedSidebar {...args} />,
  args: { collapsed: true },
};

/** The reference as the end column, its handle on its inner edge. */
export const EndSide: Story = {
  ...Playground,
  args: { panels: [panels[1]], side: "end" },
};

/** A fixed column: no handle and no collapse button. */
export const Fixed: Story = {
  ...Playground,
  args: { resizable: false, collapsible: false },
};
