import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { PortraitGroup, PortraitGroupMember } from "./PortraitGroup";

const party: PortraitGroupMember[] = [
  ...sampleCharacters.map((character) => ({
    id: character.id,
    name: character.name,
    colorSeed: character.colorSeed,
  })),
  { id: "jun", name: "Jun Okafor", colorSeed: 300 },
  { id: "bryn", name: "Bryn Tallow", colorSeed: 60 },
  { id: "dace", name: "Dace Imre", colorSeed: 180 },
];

const meta: Meta<typeof PortraitGroup> = {
  title: "Game/PortraitGroup",
  component: PortraitGroup,
  args: { members: party, max: 4, size: "md", label: "Party" },
  argTypes: {
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    spacing: { control: "inline-radio", options: ["overlap", "apart"] },
  },
};

export default meta;
type Story = StoryObj<typeof PortraitGroup>;

/** A party of six, four shown and "+2" for the rest. Hover for names. */
export const Party: Story = {};

export const Apart: Story = {
  args: { spacing: "apart", members: party.slice(0, 3), size: "lg" },
};

/** Small, with the active character ringed, as in a game list. */
export const Small: Story = {
  render: (args) => (
    <Stack>
      <PortraitGroup
        {...args}
        size="sm"
        members={party.map((member, index) => ({
          ...member,
          active: index === 0,
        }))}
      />
    </Stack>
  ),
};
