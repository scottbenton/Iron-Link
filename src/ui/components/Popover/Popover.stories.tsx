import { InfoIcon, LinkIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "./Popover";

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

/** A preview card opens on hover or focus; it holds no controls. */
export const Preview: Story = {
  render: () => (
    <Stack gap="2" maxWidth="360px">
      <Text variant="bodySm">
        Swear an iron vow to find{" "}
        <PreviewCard>
          <PreviewCardTrigger href="#kara">Kara Ironhand</PreviewCardTrigger>
          <PreviewCardContent>
            <Stack gap="1">
              <Text variant="h4" as="p">
                Kara Ironhand
              </Text>
              <Text variant="bodySm" color="muted">
                A shield-bearer of the Hinterlands, last seen on the road to
                Deepwater.
              </Text>
            </Stack>
          </PreviewCardContent>
        </PreviewCard>{" "}
        before the winter.
      </Text>
    </Stack>
  ),
};
