import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { HStack } from "ui/primitives";

import { ConditionMeter, MomentumMeter } from "../ConditionMeter";
import { XPMeter } from "./XPTrack";

const meta = {
  title: "Game/XPMeter",
  component: XPMeter,
  args: { value: 5 },
} satisfies Meta<typeof XPMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <XPMeter {...args} value={value} onChange={setValue} />;
  },
};

export const ReadOnly: Story = {};

/** Experience sits in the row of meters and matches them. */
export const BesideMeters: Story = {
  render: function Render() {
    const [xp, setXp] = useState(3);
    return (
      <HStack gap="2" alignItems="flex-start" flexWrap="wrap">
        <ConditionMeter
          label="Health"
          value={4}
          max={5}
          onChange={fn()}
          onRoll={fn()}
        />
        <ConditionMeter label="Spirit" value={2} max={5} onChange={fn()} />
        <MomentumMeter value={4} onChange={fn()} onBurn={fn()} />
        <XPMeter value={xp} onChange={setXp} />
      </HStack>
    );
  },
};

export const States: Story = {
  render: () => (
    <HStack gap="2" alignItems="flex-start" flexWrap="wrap">
      <XPMeter value={0} onChange={fn()} />
      <XPMeter label="Unspent Experience" value={12} onChange={fn()} />
      <XPMeter value={100} onChange={fn()} />
      <XPMeter value={7} onChange={fn()} disabled />
    </HStack>
  ),
};
