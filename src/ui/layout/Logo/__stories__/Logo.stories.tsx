import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { Logo } from "../Logo";

const meta: Meta<typeof Logo> = {
  title: "Layout/Logo",
  component: Logo,
  args: { size: 40, wordmark: false },
  argTypes: { size: { control: { type: "range", min: 16, max: 128 } } },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Playground: Story = {};

/** The mark and the name, as in the navigation drawer. */
export const WithWordmark: Story = { args: { wordmark: true } };

/** A labelled mark is an image; an unlabelled one is decoration. */
export const Labelled: Story = { args: { label: "Iron Link" } };

export const Sizes: Story = {
  render: () => (
    <HStack gap="4" alignItems="center">
      {[20, 32, 40, 64, 96].map((size) => (
        <Logo key={size} size={size} />
      ))}
    </HStack>
  ),
};
