import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { Box, HStack, Stack } from "ui/primitives";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { ConditionMeter } from "../ConditionMeter";
import { RollButton } from "../RollButton";
import { clamp, formatSigned } from "../shared/format";
import { StatCard } from "./StatCard";
import { StatGrid, StatGridStat } from "./StatGrid";

const kira = sampleCharacters[0];
const statNames = {
  edge: "Edge",
  heart: "Heart",
  iron: "Iron",
  shadow: "Shadow",
  wits: "Wits",
} as const;

const statsOf = (character: (typeof sampleCharacters)[number]) =>
  (Object.keys(statNames) as (keyof typeof statNames)[]).map((key) => ({
    key,
    name: statNames[key],
    value: character.stats[key],
  }));

const meta = {
  title: "Game/StatCard",
  component: StatCard,
  args: { name: "Edge", value: 3, adds: 0, onRoll: fn() },
  argTypes: { adds: { control: { type: "number", min: -9, max: 9 } } },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function Caption(props: { children: string }) {
  return (
    <Text variant="bodySm" color="muted">
      {props.children}
    </Text>
  );
}

/**
 * Each card at its own width. Adds sit after the value as a pill, the same
 * pill a condition meter roller and a roll button use.
 */
export const States: Story = {
  render: () => (
    <HStack gap="3" alignItems="flex-start" flexWrap="wrap">
      <Stack gap="1" alignItems="center">
        <StatCard name="Edge" value={3} onRoll={fn()} />
        <Caption>Rollable</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Iron" value={1} adds={2} onRoll={fn()} />
        <Caption>Adds +2</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Shadow" value={1} adds={-1} onRoll={fn()} />
        <Caption>Adds −1</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Heart" value={2} onRoll={fn()} disabled />
        <Caption>Disabled</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Heart" value={2} adds={1} onRoll={fn()} disabled />
        <Caption>Disabled, adds</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Wits" value={2} />
        <Caption>Read-only</Caption>
      </Stack>
      <Stack gap="1" alignItems="center">
        <StatCard name="Wits" value={2} adds={1} />
        <Caption>Read-only, adds</Caption>
      </Stack>
    </HStack>
  ),
};

/**
 * Every card at the 60px minimum, the width a 328px sidebar gives them. The
 * adds badge sits on each card's corner, outside it, so it never takes room
 * from the name or the value.
 */
export const MinimumWidth: Story = {
  render: () => (
    <Stack gap="4">
      <Box display="grid" gridTemplateColumns="repeat(5, 60px)" gap="6px">
        {statsOf(kira).map((stat) => (
          <StatCard
            key={stat.key}
            name={stat.name}
            value={stat.value}
            onRoll={fn()}
          />
        ))}
      </Box>
      <Box display="grid" gridTemplateColumns="repeat(5, 60px)" gap="6px">
        {statsOf(kira).map((stat) => (
          <StatCard
            key={stat.key}
            name={stat.name}
            value={stat.value}
            adds={1}
            onRoll={fn()}
          />
        ))}
      </Box>
    </Stack>
  ),
};

const longStats: StatGridStat[] = [
  { key: "resolve", name: "Resolve", value: 2 },
  { key: "instinct", name: "Instinct", value: 3 },
  { key: "fortitude", name: "Fortitude", value: 1 },
  { key: "presence", name: "Presence", value: 2 },
  { key: "ingenuity", name: "Ingenuity", value: 1 },
];

/**
 * Names longer than the core five, as a homebrew ruleset might use. At the
 * minimum width a name that still does not fit ends in an ellipsis; the
 * full name is in the card's accessible name.
 */
export const LongNames: Story = {
  render: () => (
    <Stack gap="4">
      <Box width="324px">
        <StatGrid stats={longStats} onRoll={fn()} />
      </Box>
      <Box width="440px">
        <StatGrid stats={longStats} adds={1} onRoll={fn()} />
      </Box>
    </Stack>
  ),
};

/** Each sample character in a 328px sidebar (360px less its padding). */
export const Grid: Story = {
  render: () => (
    <Stack gap="6" width="328px">
      {sampleCharacters.map((character) => (
        <Stack key={character.id} gap="2">
          <span>{character.name}</span>
          <StatGrid stats={statsOf(character)} onRoll={fn()} />
        </Stack>
      ))}
    </Stack>
  ),
};

/**
 * Adds apply to whichever stat is rolled next, so every card shows them. In
 * a 328px sidebar the pill drops under each value; with room (440px) it sits
 * beside it.
 */
export const GridWithAdds: Story = {
  render: () => (
    <Stack gap="6">
      <Stack gap="2" width="328px">
        <Caption>328px sidebar, adds +1</Caption>
        <StatGrid stats={statsOf(kira)} adds={1} onRoll={fn()} />
      </Stack>
      <Stack gap="2" width="440px">
        <Caption>440px, adds −1</Caption>
        <StatGrid stats={statsOf(kira)} adds={-1} onRoll={fn()} />
      </Stack>
    </Stack>
  ),
};

/**
 * Narrower than five cards at 60px (the 280px minimum sidebar leaves 248px):
 * the row wraps into three and two, never four and one.
 */
export const NarrowGrid: Story = {
  render: () => (
    <Stack gap="6" width="248px">
      <StatGrid stats={statsOf(kira)} onRoll={fn()} />
      <StatGrid stats={statsOf(kira)} adds={2} onRoll={fn()} />
    </Stack>
  ),
};

const fourStats = statsOf(kira).filter((stat) => stat.key !== "shadow");
const sixStats: StatGridStat[] = [
  ...statsOf(kira),
  { key: "wealth", name: "Wealth", value: 1 },
];

/**
 * Wrapping by count and the grid's own width (a container query, never the
 * window): one row while every card gets 60px, else even rows, so no card is
 * left alone. Four wrap as 2 + 2 under 258px, five as 3 + 2 under 324px, six
 * as 3 + 3 under 390px. The four and six stat sets are homebrew examples.
 */
export const WrapByCount: Story = {
  render: () => (
    <Stack gap="6">
      {[200, 248, 300, 328, 400, 460].map((width) => (
        <Stack key={width} gap="2">
          <Caption>{`${width}px`}</Caption>
          <HStack gap="4" alignItems="flex-start">
            {[fourStats, statsOf(kira), sixStats].map((stats) => (
              <Box
                key={stats.length}
                width={`${width}px`}
                flex="none"
                outline="1px dashed"
                outlineColor="border.subtle"
              >
                <StatGrid stats={stats} onRoll={fn()} />
              </Box>
            ))}
          </HStack>
        </Stack>
      ))}
    </Stack>
  ),
};

export const ReadOnlyGrid: Story = {
  render: () => (
    <Box width="328px">
      <StatGrid stats={statsOf(kira)} />
    </Box>
  ),
};

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
        <StatGrid stats={statsOf(kira)} adds={adds} onRoll={fn()} />
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
