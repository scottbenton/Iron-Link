import { Sparkle } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { HStack, Stack } from "styled-system/jsx";

import { Button } from "../../components/Button";
import { Text } from "../../components/Text";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { ConditionMeter } from "../ConditionMeter";
import { StatGrid } from "../StatCard";
import { clamp, formatSigned } from "../shared/format";
import { RollButton } from "./RollButton";

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

const kira = sampleCharacters[0];
const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * How the adds badge moves, on every kind of roll control at once. Setting
 * adds fades and grows each badge in (140ms, out curve); a change bumps the
 * pill and fades the new number in from the side it moved to (200ms); Clear
 * shrinks them away faster (80ms, in curve), still showing the last value.
 * A page that loads with adds already set shows them without animating.
 * Reduced motion has none of it: the badge appears, changes and goes at once.
 */
export const AddsBadgeMotion: Story = {
  render: function Render() {
    const [adds, setAdds] = useState(0);
    const step = (delta: number) =>
      setAdds((current) => clamp(current + delta, -9, 9));
    return (
      <Stack gap="5" width="360px">
        <Stack gap="2">
          <HStack gap="2" flexWrap="wrap">
            <Button size="sm" onClick={() => step(-1)} disabled={adds <= -9}>
              Subtract 1
            </Button>
            <Button size="sm" onClick={() => step(1)} disabled={adds >= 9}>
              Add 1
            </Button>
            <Button size="sm" onClick={() => setAdds(3)}>
              Set +3
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdds(0)}>
              Clear
            </Button>
          </HStack>
          <Text variant="bodySm" color="muted">
            {`Adds ${formatSigned(adds)}`}
          </Text>
        </Stack>
        <StatGrid
          stats={statKeys.map((key) => ({
            key,
            name: capitalize(key),
            value: kira.stats[key],
          }))}
          adds={adds}
          onRoll={fn()}
        />
        <HStack gap="2" flexWrap="wrap">
          <ConditionMeter
            label="Health"
            value={kira.meters.health}
            max={5}
            adds={adds}
            onRoll={fn()}
          />
          <ConditionMeter
            label="Spirit"
            value={kira.meters.spirit}
            max={5}
            adds={adds}
            onRoll={fn()}
          />
        </HStack>
        <HStack gap="3" flexWrap="wrap">
          <RollButton adds={adds} onClick={fn()}>
            {`${sampleMoves.faceDanger.name} +Edge`}
          </RollButton>
          <RollButton size="sm" adds={adds} disabled>
            Roll +Wits
          </RollButton>
        </HStack>
      </Stack>
    );
  },
};
