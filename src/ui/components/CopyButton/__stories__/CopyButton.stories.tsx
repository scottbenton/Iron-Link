import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { CopyButton } from "../CopyButton";

const meta: Meta<typeof CopyButton> = {
  title: "Components/CopyButton",
  component: CopyButton,
  args: {
    text: "https://app.ironlink.app/join/4f2a9c",
    label: "Copy Invite Link",
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

/** Press it: the icon turns to a check and "Copied" is announced. */
export const Playground: Story = {};

export const IconOnly: Story = {
  args: { iconOnly: true, label: "Copy invite link" },
};

export const Sizes: Story = {
  render: (args) => (
    <HStack gap="3">
      <CopyButton {...args} size="sm" />
      <CopyButton {...args} />
      <CopyButton {...args} variant="primary" />
    </HStack>
  ),
};
