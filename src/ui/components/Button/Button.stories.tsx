import {
  ArrowRight,
  DiceFive,
  FloppyDisk,
  Plus,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, HStack, Stack } from "styled-system/jsx";

import { schemeNames, schemes } from "../../theme";
import { Text } from "../Text";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save Character" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["outline", "primary", "gradient", "danger", "ghost", "text"],
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
      <Button variant="gradient">Start Playing</Button>
      <Button variant="primary">Create Game</Button>
      <Button>Edit Character</Button>
      <Button variant="danger">Delete Campaign</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="text">View Rules</Button>
    </HStack>
  ),
};

/**
 * The brand gradient, for a page's one call to action: the home page's Start
 * Playing, Create Game on an empty games list, the last step of creating a
 * game. It replaces the app's `GradientButton`. Everywhere else the main
 * action is `primary`.
 */
export const Gradient: Story = {
  render: function GradientStory() {
    const [loading, setLoading] = useState(false);
    return (
      <Stack gap="4" alignItems="start">
        <HStack gap="3" flexWrap="wrap">
          <Button
            variant="gradient"
            endIcon={<ArrowRight />}
            render={<a href="#/games" />}
            nativeButton={false}
          >
            Start Playing
          </Button>
          <Button variant="outline">Open Source</Button>
        </HStack>
        <HStack gap="3" flexWrap="wrap">
          <Button variant="gradient" startIcon={<Plus />}>
            Create Game
          </Button>
          <Button
            variant="gradient"
            loading={loading}
            loadingLabel="Creating Character"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1800);
            }}
          >
            Create Character
          </Button>
          <Button variant="gradient" size="sm" startIcon={<Plus />}>
            Add World
          </Button>
          <Button variant="gradient" disabled>
            Join Game
          </Button>
        </HStack>
      </Stack>
    );
  },
};

/**
 * The gradient in every colour scheme at once (each row sets its scheme on
 * itself; Default follows the toolbar's scheme). White text keeps at least
 * 4.5:1 in each; switch the Mode toolbar to see dark mode.
 */
export const GradientSchemes: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="720px">
      {schemeNames.map((name) => (
        <Stack
          key={name}
          gap="2"
          alignItems="start"
          data-panda-theme={name === "default" ? undefined : name}
        >
          <Text variant="label" color="muted">
            {schemes[name].label}
          </Text>
          <Button variant="gradient" startIcon={<Plus />}>
            Create Game
          </Button>
        </Stack>
      ))}
    </Grid>
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
