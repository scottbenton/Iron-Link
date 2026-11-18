import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { GradientBox } from "./GradientBox";

const meta: Meta<typeof GradientBox> = {
  title: "Components/GradientBox",
  component: GradientBox,
  args: {
    variant: "border",
    radius: "lg",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["border", "fill"] },
    radius: { control: "inline-radio", options: ["md", "lg", "full"] },
    spin: { control: "boolean" },
  },
  render: (args) => (
    <GradientBox {...args}>
      <Stack gap="1" padding="4" maxWidth="320px">
        <Text variant="h3">Fulfill Your Vow</Text>
        <Text variant="bodySm" color="muted">
          Follows the page&apos;s colour scheme.
        </Text>
      </Stack>
    </GradientBox>
  ),
};

export default meta;
type Story = StoryObj<typeof GradientBox>;

export const Playground: Story = {};

/** The border turning slowly, for something under way. */
export const Spinning: Story = {
  args: { spin: true },
};
