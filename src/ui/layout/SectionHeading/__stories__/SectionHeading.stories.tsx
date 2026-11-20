import { PlusIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../../components/Button";
import { SectionHeading } from "../SectionHeading";

const meta: Meta<typeof SectionHeading> = {
  title: "Layout/SectionHeading",
  component: SectionHeading,
  args: { title: "Characters", as: "h2" },
  argTypes: {
    as: { control: "inline-radio", options: ["h2", "h3"] },
  },
};

export default meta;
type Story = StoryObj<typeof SectionHeading>;

export const Playground: Story = {};

export const WithDescriptionAndAction: Story = {
  args: {
    description: "Everyone playing in The Iron Expanse.",
    actions: (
      <Button size="sm">
        <PlusIcon />
        Add Character
      </Button>
    ),
  },
};
