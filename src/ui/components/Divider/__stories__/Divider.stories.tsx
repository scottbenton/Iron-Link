import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { Button } from "../../Button";
import { Text } from "../../Text";
import { Divider } from "../Divider";

const meta: Meta<typeof Divider> = {
  title: "Components/Divider",
  component: Divider,
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <Stack gap="3" maxWidth="420px">
      <Text variant="bodySm">Edge 3, Heart 2, Iron 1</Text>
      <Divider />
      <Text variant="bodySm">Health 5, Spirit 4, Supply 3</Text>
      <Divider subtle />
      <Text variant="bodySm">Momentum +6</Text>
    </Stack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <HStack gap="3" height="32px">
      <Text variant="bodySm">Health 5</Text>
      <Divider orientation="vertical" />
      <Text variant="bodySm">Spirit 4</Text>
      <Divider orientation="vertical" />
      <Text variant="bodySm">Supply 3</Text>
    </HStack>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Stack gap="4" maxWidth="420px">
      <Button variant="primary">Create Game</Button>
      <Divider>or</Divider>
      <Button>Join with an Invite Link</Button>
      <Divider labelAlign="start">Advanced</Divider>
    </Stack>
  ),
};
