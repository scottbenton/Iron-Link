import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "ui/primitives";

import { Text } from "../../Text";
import { Surface } from "../Surface";

const meta: Meta<typeof Surface> = {
  title: "Components/Surface",
  component: Surface,
  args: { tone: "flat", radius: "lg", padding: "md" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["flat", "raised", "inset", "canvas"],
    },
    radius: {
      control: "inline-radio",
      options: ["md", "lg", "xl"],
    },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Surface>;

export const Playground: Story = {
  render: (args) => (
    <Surface {...args}>
      <Text variant="bodySm">Character sheet</Text>
    </Surface>
  ),
};

export const Tones: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 4 }} gap="4">
      {(["flat", "raised", "inset", "canvas"] as const).map((tone) => (
        <Surface key={tone} tone={tone} padding="md">
          <Text variant="label">
            {tone.charAt(0).toUpperCase() + tone.slice(1)}
          </Text>
        </Surface>
      ))}
    </Grid>
  ),
};

/** An inset well inside a raised surface, as on a track. */
export const Nested: Story = {
  render: () => (
    <Surface tone="raised" padding="lg" radius="xl">
      <Text variant="h3" as="h2">
        Momentum
      </Text>
      <Surface tone="inset" padding="sm" radius="md">
        <Text variant="numeric">+6</Text>
      </Surface>
    </Surface>
  ),
};
