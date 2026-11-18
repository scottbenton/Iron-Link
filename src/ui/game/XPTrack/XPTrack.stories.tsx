import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import { XPTrack } from "./XPTrack";

const meta = {
  title: "Game/XPTrack",
  component: XPTrack,
  args: { earned: 8, spent: 3, total: 30 },
} satisfies Meta<typeof XPTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [earned, setEarned] = useState(args.earned);
    const [spent, setSpent] = useState(args.spent ?? 0);
    return (
      <XPTrack
        {...args}
        earned={earned}
        spent={spent}
        onEarnedChange={setEarned}
        onSpentChange={setSpent}
      />
    );
  },
};

export const ReadOnly: Story = {};

export const States: Story = {
  render: () => (
    <Stack gap="6">
      <XPTrack earned={0} />
      <XPTrack earned={12} spent={12} />
      <XPTrack earned={30} spent={18} />
    </Stack>
  ),
};
