import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack } from "styled-system/jsx";

import { Clock } from "./Clock";

const meta = {
  title: "Game/Clock",
  component: Clock,
  args: { label: "The Iron Siege falls", segments: 6, value: 2 },
  argTypes: {
    segments: { control: "inline-radio", options: [4, 6, 8, 10] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Clock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <Clock {...args} value={value} onChange={setValue} />;
  },
};

function Interactive(props: {
  label: string;
  segments: number;
  start: number;
}) {
  const [value, setValue] = useState(props.start);
  return (
    <Clock
      label={props.label}
      segments={props.segments}
      value={value}
      onChange={setValue}
    />
  );
}

export const SegmentCounts: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      <Interactive label="Guards notice the breach" segments={4} start={1} />
      <Interactive label="The storm arrives" segments={6} start={3} />
      <Interactive label="Raiders reach the village" segments={8} start={5} />
      <Interactive label="The Forgeborn awaken" segments={10} start={7} />
    </HStack>
  ),
};

export const Full: Story = {
  args: { label: "The bridge collapses", segments: 4, value: 4 },
};

export const ReadOnly: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start">
      <Clock label="Rumours spread" segments={6} value={2} />
      <Clock label="Supplies run out" segments={10} value={10} />
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-end">
      <Clock label="Small" segments={6} value={2} size="sm" />
      <Clock label="Medium" segments={6} value={3} size="md" />
      <Clock label="Large" segments={8} value={5} size="lg" />
    </HStack>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, onChange: () => {} },
};
