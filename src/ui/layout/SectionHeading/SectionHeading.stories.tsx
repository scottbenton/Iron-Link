import { PlusIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { SectionHeading } from "./SectionHeading";

const meta: Meta<typeof SectionHeading> = {
  title: "Layout/SectionHeading",
  component: SectionHeading,
  args: { title: "Characters", as: "h2", variant: "plain" },
  argTypes: {
    as: { control: "inline-radio", options: ["h2", "h3"] },
    variant: { control: "inline-radio", options: ["plain", "band", "bare"] },
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

export const Variants: Story = {
  render: () => (
    <Stack gap="6">
      <SectionHeading title="Vows" variant="plain" />
      <SectionHeading title="Assets" variant="band" as="h3" />
      <SectionHeading title="Bonds" variant="bare" as="h3" />
    </Stack>
  ),
};
