import { InfoIcon, LinkIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { Text } from "../../Text";
import { Popover } from "../Popover";
import { PopoverClose } from "../PopoverClose";
import { PopoverContent } from "../PopoverContent";
import { PopoverTrigger } from "../PopoverTrigger";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A titled popover with a description, a body and a Close button. */
export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton label="About Momentum">
            <InfoIcon />
          </IconButton>
        }
      />
      <PopoverContent
        title="Momentum"
        description="Your progress and readiness, from -6 to +10."
      >
        <Text variant="bodySm">
          Burn momentum to replace your action die. Afterwards it resets to your
          reset value, which falls with each impact.
        </Text>
      </PopoverContent>
    </Popover>
  ),
};

/** Actions inside; PopoverClose closes it after the choice. */
export const WithActions: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button startIcon={<LinkIcon />} />}>
        Invite Players
      </PopoverTrigger>
      <PopoverContent
        title="Invite Players"
        description="Anyone with the link can join The Iron Wardens."
      >
        <HStack gap="2" justifyContent="flex-end">
          <PopoverClose render={<Button variant="ghost" />}>
            Cancel
          </PopoverClose>
          <PopoverClose render={<Button variant="primary" />}>
            Copy Link
          </PopoverClose>
        </HStack>
      </PopoverContent>
    </Popover>
  ),
};
