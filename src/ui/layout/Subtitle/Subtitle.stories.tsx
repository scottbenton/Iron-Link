import type { Meta, StoryObj } from "@storybook/react-vite";

import { Subtitle } from "./Subtitle";

const meta: Meta<typeof Subtitle> = {
  title: "Layout/Subtitle",
  component: Subtitle,
  args: {
    items: ["Starforged", "Guided", "Kira Vale, Orrin Thale"],
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "small", "label"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Subtitle>;

/** Facts in a row, split by a dot that screen readers hear as a comma. */
export const Playground: Story = {};

/** One sentence instead of a list. */
export const Sentence: Story = {
  args: {
    items: undefined,
    children: "Pick up where you left off, or start something new.",
  },
};

export const Small: Story = { args: { variant: "small" } };

export const Label: Story = { args: { variant: "label" } };
