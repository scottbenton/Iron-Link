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

import { Box, Grid, HStack, Stack } from "ui/primitives";

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
 * The gradient call to action, as on the app's main flows (Start Playing,
 * Create Game): white text on a dark face inside a spinning ring of the
 * scheme's gradient. Hover, keyboard focus and press thicken the ring; a
 * press also sinks the button onto its ledge. It replaces the app's
 * `GradientButton` and is built on `GradientBox`. Disabled, the ring goes
 * flat grey and stops; under reduced motion it holds still. The first one is
 * a link (`render`).
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
          <Button variant="gradient" startIcon={<Plus />}>
            Add World
          </Button>
          <Button variant="gradient" disabled>
            Join Game
          </Button>
        </HStack>
        <Box width="320px">
          <Button variant="gradient" fullWidth>
            Begin Your Journey
          </Button>
        </Box>
      </Stack>
    );
  },
};

/**
 * Every colour scheme at once, on the page and on a dark panel (each row
 * sets its scheme on itself; Default follows the toolbar). The ring follows
 * the scheme; the face stays dark, so the white label reads in every one.
 * Switch the Mode toolbar to see the page side in dark mode too.
 */
export const GradientSchemes: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 2 }} gap="4" maxWidth="640px">
      {(["light", "dark"] as const).map((mode) => (
        <Stack
          key={mode}
          gap="3"
          padding="4"
          borderRadius="lg"
          background="bg.canvas"
          color="fg.default"
          data-theme={mode === "dark" ? "dark" : undefined}
        >
          <Text variant="label" color="muted">
            {mode === "dark" ? "Dark panel" : "Page"}
          </Text>
          {schemeNames.map((name) => (
            <HStack
              key={name}
              gap="3"
              justifyContent="space-between"
              data-panda-theme={name === "default" ? undefined : name}
            >
              <Text variant="bodySm" color="muted">
                {schemes[name].label}
              </Text>
              <Button variant="gradient" startIcon={<Plus />}>
                Create Game
              </Button>
            </HStack>
          ))}
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
