import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { Skeleton } from "../Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { variant: "text", lines: 3 } };

/** A character card loading. */
export const CharacterCard: Story = {
  render: () => (
    <Stack
      gap="3"
      maxWidth="360px"
      padding="4"
      borderRadius="lg"
      border="1px solid token(colors.border.default)"
      aria-busy="true"
      aria-label="Loading character"
    >
      <HStack gap="3">
        <Skeleton variant="circle" width={56} />
        <Stack gap="2" flex="1">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" />
        </Stack>
      </HStack>
    </Stack>
  ),
};
