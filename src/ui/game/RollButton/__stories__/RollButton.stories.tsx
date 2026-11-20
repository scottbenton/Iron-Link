import { Sparkle } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { sampleMoves } from "../../../docs/fixtures/datasworn";
import { RollButton } from "../RollButton";

const meta = {
  title: "Game/RollButton",
  component: RollButton,
  args: { children: "Roll +Edge", adds: 0 },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof RollButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Each press rolls a d6 and the die lands on it, as an action roll's button
 * does once its `onRoll` returns the action die.
 */
export const Playground: Story = {
  args: { onRoll: () => Math.floor(Math.random() * 6) + 1 },
};

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

/**
 * Adds for the next roll: the same pill as on stat cards and condition
 * meter rollers, after the label. Negative adds use the same pill.
 */
export const WithAdds: Story = {
  render: () => (
    <Stack gap="3" alignItems="flex-start">
      <HStack gap="3" alignItems="center" flexWrap="wrap">
        <RollButton size="sm" adds={1}>
          Roll +Edge
        </RollButton>
        <RollButton
          adds={1}
        >{`${sampleMoves.faceDanger.name} +Edge`}</RollButton>
        <RollButton size="lg" adds={2}>
          Roll +Heart
        </RollButton>
      </HStack>
      <HStack gap="3" alignItems="center" flexWrap="wrap">
        <RollButton adds={-1}>{`${sampleMoves.strike.name} +Iron`}</RollButton>
        <RollButton adds={1} disabled>
          Roll +Wits
        </RollButton>
      </HStack>
      <Stack gap="2" width="240px">
        <RollButton fullWidth size="sm" adds={1}>
          {`${sampleMoves.undertakeAnExpedition.name} +Wits`}
        </RollButton>
      </Stack>
    </Stack>
  ),
};
