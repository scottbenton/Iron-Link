import {
  ArrowsOutCardinalIcon,
  CopyIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "styled-system/jsx";

import { BreadcrumbItem, Breadcrumbs } from "../../components/Breadcrumbs";
import {
  ActionToolbar,
  ActionToolbarButton,
  ActionToolbarGroup,
  ActionToolbarIconButton,
  ActionToolbarSeparator,
} from "./ActionToolbar";

const meta: Meta<typeof ActionToolbar> = {
  title: "Layout/ActionToolbar",
  component: ActionToolbar,
  args: { label: "Note Actions", wrap: false },
};

export default meta;
type Story = StoryObj<typeof ActionToolbar>;

const breadcrumbs = (
  <Breadcrumbs>
    <BreadcrumbItem href="#notes">Notes</BreadcrumbItem>
    <BreadcrumbItem href="#sessions">Sessions</BreadcrumbItem>
    <BreadcrumbItem current>The Drowned Archive</BreadcrumbItem>
  </Breadcrumbs>
);

const actions = (
  <>
    <ActionToolbarGroup>
      <ActionToolbarButton icon={<PencilSimpleIcon />}>
        Rename
      </ActionToolbarButton>
      <ActionToolbarButton icon={<ArrowsOutCardinalIcon />}>
        Move
      </ActionToolbarButton>
      <ActionToolbarButton icon={<LockSimpleIcon />}>
        Guide Only
      </ActionToolbarButton>
    </ActionToolbarGroup>
    <ActionToolbarSeparator />
    <ActionToolbarIconButton label="Copy Link">
      <CopyIcon />
    </ActionToolbarIconButton>
    <ActionToolbarIconButton label="Share">
      <ShareNetworkIcon />
    </ActionToolbarIconButton>
    <ActionToolbarSeparator />
    <ActionToolbarButton danger icon={<TrashIcon />}>
      Delete
    </ActionToolbarButton>
  </>
);

/** Breadcrumbs to the open note over its actions. */
export const Playground: Story = {
  args: { breadcrumbs, children: actions },
};

/**
 * In a narrow column the strip scrolls sideways, fading the edge that has
 * more actions past it.
 */
export const Narrow: Story = {
  args: { breadcrumbs, children: actions },
  render: (args) => (
    <Box maxWidth="320px">
      <ActionToolbar {...args} />
    </Box>
  ),
};

/** With `wrap`, actions that don't fit take another row instead. */
export const Wrapping: Story = {
  ...Narrow,
  args: { breadcrumbs, children: actions, wrap: true },
};
