import { Sparkle } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "styled-system/jsx";

import { sampleMoves } from "../../stories/fixtures/datasworn";
import { RollButton } from "./RollButton";

const meta = {
  title: "Game/RollButton",
  component: RollButton,
  args: { children: "Roll +Edge" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof RollButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MoveRolls: Story = {
  render: () => (
    <HStack gap="3" flexWrap="wrap">
      <RollButton>{`${sampleMoves.faceDanger.name} +Edge`}</RollButton>
      <RollButton>{`${sampleMoves.strike.name} +Iron`}</RollButton>
      <RollButton icon={<Sparkle weight="fill" />}>
        {sampleMoves.askTheOracle.name}
      </RollButton>
      <RollButton icon={null}>{sampleMoves.fulfillYourVow.name}</RollButton>
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <HStack gap="3" alignItems="center" flexWrap="wrap">
      <RollButton size="sm">Roll Action + Theme</RollButton>
      <RollButton size="md">Roll +Heart</RollButton>
      <RollButton size="lg">Ask the Oracle</RollButton>
    </HStack>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, children: "Roll +Wits" },
};

export const FullWidth: Story = {
  render: () => (
    <Stack gap="2" maxWidth="320px">
      <RollButton fullWidth>Roll Spaceborne Peril</RollButton>
      <RollButton fullWidth size="sm">
        Roll Planetside Peril
      </RollButton>
    </Stack>
  ),
};
