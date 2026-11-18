import {
  DiceFive,
  FloppyDisk,
  Plus,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "styled-system/jsx";

import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save Character" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["outline", "primary", "danger", "ghost", "text"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <HStack gap="3" flexWrap="wrap">
      <Button variant="primary">Create Game</Button>
      <Button>Edit Character</Button>
      <Button variant="danger">Delete Campaign</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="text">View Rules</Button>
    </HStack>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <HStack gap="3" flexWrap="wrap">
      <Button variant="primary" startIcon={<Plus />}>
        Add Asset
      </Button>
      <Button startIcon={<UserPlus />}>Invite Players</Button>
      <Button startIcon={<DiceFive />}>Roll Dice</Button>
      <Button variant="danger" startIcon={<Trash />}>
        Remove Character
      </Button>
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <HStack gap="3" alignItems="center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="sm" variant="primary" startIcon={<Plus />}>
        Add Note
      </Button>
    </HStack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <HStack gap="3">
      <Button disabled>Edit</Button>
      <Button variant="primary" disabled>
        Create World
      </Button>
      <Button variant="ghost" disabled>
        Cancel
      </Button>
    </HStack>
  ),
};

/**
 * The label swaps to the loading label at the same width, so nothing moves.
 * Loading labels carry no ellipsis.
 */
export const Loading: Story = {
  render: function LoadingStory() {
    const [loading, setLoading] = useState(false);
    return (
      <Stack gap="3" alignItems="start">
        <Button
          variant="primary"
          startIcon={<FloppyDisk />}
          loading={loading}
          loadingLabel="Creating World"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1800);
          }}
        >
          Create World
        </Button>
        <Button loading>Saving</Button>
      </Stack>
    );
  },
};

export const FullWidth: Story = {
  render: () => (
    <Stack width="320px">
      <Button variant="primary" fullWidth>
        Sign In
      </Button>
    </Stack>
  ),
};
