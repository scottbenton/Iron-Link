import { BellIcon, ChatCircleIcon, UsersIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { IconButton } from "../../IconButton";
import { Badge } from "../Badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  args: { children: null },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The count is in the button's name too; the badge is decorative. */
export const Counts: Story = {
  render: () => (
    <HStack gap="5">
      <Badge count={3}>
        <IconButton label="Notifications, 3 new">
          <BellIcon />
        </IconButton>
      </Badge>
      <Badge count={120} tone="danger">
        <IconButton label="Messages, more than 99 unread">
          <ChatCircleIcon />
        </IconButton>
      </Badge>
      <Badge dot>
        <IconButton label="Players, someone joined">
          <UsersIcon />
        </IconButton>
      </Badge>
      <Badge count={0}>
        <IconButton label="Notifications">
          <BellIcon />
        </IconButton>
      </Badge>
    </HStack>
  ),
};
