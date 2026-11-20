import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { Avatar, AvatarGroup } from "..";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  args: { name: "Kara Ironhand" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

const portrait =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#4b5d73"/><circle cx="40" cy="32" r="14" fill="#d9c7b0"/><path d="M14 80c4-18 14-26 26-26s22 8 26 26z" fill="#7a3b2e"/></svg>',
  );

export const Sizes: Story = {
  render: () => (
    <Stack gap="4">
      <HStack gap="3">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Avatar key={size} name="Kara Ironhand" size={size} />
        ))}
      </HStack>
      <HStack gap="3">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Avatar key={size} name="Kara Ironhand" src={portrait} size={size} />
        ))}
      </HStack>
    </Stack>
  ),
};

/** Each name keeps its own colour. A broken image falls back to initials. */
export const Colours: Story = {
  render: () => (
    <HStack gap="3">
      {[
        "Kara Ironhand",
        "Ash",
        "Bryn of Deepwater",
        "Thorvald Grey",
        "Ysolde",
        "Elena Nightborne",
      ].map((name) => (
        <Avatar key={name} name={name} />
      ))}
      <Avatar name="Missing Portrait" src="/missing.png" />
      <Avatar />
    </HStack>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup max={4} label="Players">
      <Avatar name="Kara Ironhand" src={portrait} />
      <Avatar name="Bryn of Deepwater" />
      <Avatar name="Thorvald Grey" />
      <Avatar name="Ysolde" />
      <Avatar name="Elena Nightborne" />
      <Avatar name="Ash" />
    </AvatarGroup>
  ),
};
