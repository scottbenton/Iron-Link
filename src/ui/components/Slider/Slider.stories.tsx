import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import { Slider } from "./Slider";

const meta = {
  title: "Components/Slider",
  component: Slider<number>,
  args: {
    label: "Dice volume",
    defaultValue: 0.6,
    min: 0,
    max: 1,
    step: 0.05,
    showValue: true,
    description: "How loud the dice sound when you roll.",
    format: { style: "percent" },
  },
  decorators: [
    (Story) => (
      <Stack maxWidth="360px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof Slider<number>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ClockSegments: Story = {
  render: function Render() {
    const [segments, setSegments] = useState(6);
    return (
      <Slider
        label="Clock segments"
        min={4}
        max={10}
        step={2}
        value={segments}
        onValueChange={setSegments}
        showValue
        marks={[4, 6, 8, 10].map((value) => ({ value, label: value }))}
        getAriaValueText={(formatted) => `${formatted} segments`}
      />
    );
  },
};

export const Range: Story = {
  render: () => (
    <Slider<number[]>
      label="Roll range"
      min={1}
      max={100}
      defaultValue={[21, 60]}
      showValue
      getThumbLabel={(index) => (index === 0 ? "Lowest roll" : "Highest roll")}
      description="Oracle results between these rolls."
    />
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="5">
      <Slider label="Map zoom" defaultValue={40} showValue disabled />
      <Slider
        label="Grid opacity"
        defaultValue={5}
        showValue
        error="The grid is hard to see below 10%."
      />
    </Stack>
  ),
};
