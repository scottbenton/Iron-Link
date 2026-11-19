import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { PortraitGroup, PortraitGroupMember } from "./PortraitGroup";

const partySchemes = ["cinder", "myriad", undefined] as const;

const party: PortraitGroupMember[] = [
  ...sampleCharacters.map((character, index) => ({
    id: character.id,
    name: character.name,
    colorScheme: partySchemes[index],
  })),
  { id: "jun", name: "Jun Okafor" },
  { id: "bryn", name: "Bryn Tallow" },
  { id: "dace", name: "Dace Imre" },
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

/**
 * A party of six with a max of four: three portraits and "+3", which names
 * the rest for screen readers. Each portrait is ringed in its character's
 * theme, gray without one. Hover for names.
 */
export const Party: Story = {};

/**
 * Two characters, as on a game in the games list. The front portrait's ring,
 * in its character's colour scheme, is all that separates it from the one
 * behind: there is no gap ring.
 */
export const TwoCharacters: Story = {
  args: { members: party.slice(0, 2), max: undefined },
};

export const Apart: Story = {
  args: { spacing: "apart", members: party.slice(0, 3), size: "lg" },
};

/** Small, as in a game list. */
export const Small: Story = {
  render: (args) => (
    <Stack>
      <PortraitGroup {...args} size="sm" members={party} />
    </Stack>
  ),
};
