import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { HStack, Stack } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { StatCard } from "./StatCard";
import { StatGrid } from "./StatGrid";

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
  args: { name: "Edge", value: 3, onRoll: fn() },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <HStack gap="3" alignItems="flex-start">
      <StatCard name="Edge" value={3} onRoll={fn()} />
      <StatCard name="Iron" value={1} adds={2} onRoll={fn()} />
      <StatCard name="Heart" value={2} onRoll={fn()} disabled />
      <StatCard name="Wits" value={2} />
    </HStack>
  ),
};

export const Grid: Story = {
  render: () => (
    <Stack gap="6">
      {sampleCharacters.map((character) => (
        <Stack key={character.id} gap="2">
          <span>{character.name}</span>
          <StatGrid stats={statsOf(character)} onRoll={fn()} />
        </Stack>
      ))}
    </Stack>
  ),
};

export const GridWithAdds: Story = {
  render: () => <StatGrid stats={statsOf(kira)} adds={1} onRoll={fn()} />,
};

export const ReadOnlyGrid: Story = {
  render: () => <StatGrid stats={statsOf(kira)} />,
};
