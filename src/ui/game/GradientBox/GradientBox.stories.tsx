import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "ui/components/Text";
import { Grid, Stack } from "ui/primitives";

import { GradientBox } from "./GradientBox";

const meta: Meta<typeof GradientBox> = {
  title: "Game/GradientBox",
  component: GradientBox,
  args: {
    gradient: "ring",
    variant: "border",
    thickness: "medium",
    radius: "lg",
  },
  argTypes: {
    gradient: { control: "inline-radio", options: ["ring", "icon"] },
    variant: { control: "inline-radio", options: ["border", "fill", "wash"] },
    thickness: {
      control: "inline-radio",
      options: ["thin", "medium", "thick"],
    },
    radius: {
      control: "inline-radio",
      options: ["none", "md", "lg", "xl", "full"],
    },
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

/** Each variant with each gradient. */
export const Variants: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 3 }} gap="4">
      {(["border", "fill", "wash"] as const).flatMap((variant) =>
        (["ring", "icon"] as const).map((gradient) => (
          <GradientBox
            key={`${variant}-${gradient}`}
            variant={variant}
            gradient={gradient}
            radius="lg"
          >
            <Stack padding="4">
              <Text variant="label">
                {variant}, {gradient}
              </Text>
            </Stack>
          </GradientBox>
        )),
      )}
    </Grid>
  ),
};

/** The border turning slowly, for something under way. */
export const Spinning: Story = {
  args: { spin: true, radius: "xl" },
};
