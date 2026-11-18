import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { sampleRolls } from "../../stories/fixtures/rolls";
import { DiceDisplay } from "./DiceDisplay";

const meta = {
  title: "Game/DiceDisplay",
  component: DiceDisplay,
  args: { roll: sampleRolls.faceDangerStrongHit, labelled: true },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    roll: {
      control: "select",
      options: Object.keys(sampleRolls),
      mapping: sampleRolls,
    },
  },
} satisfies Meta<typeof DiceDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EveryRoll: Story = {
  render: () => (
    <Stack gap="6">
      {Object.entries(sampleRolls).map(([key, roll]) => (
        <DiceDisplay key={key} roll={roll} labelled />
      ))}
    </Stack>
  ),
};

export const Compact: Story = {
  render: () => (
    <Stack gap="3">
      {Object.entries(sampleRolls).map(([key, roll]) => (
        <DiceDisplay key={key} roll={roll} size="sm" labelled />
      ))}
    </Stack>
  ),
};
