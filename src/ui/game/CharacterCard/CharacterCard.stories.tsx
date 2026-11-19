import { ArrowSquareOut } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "ui/components/Button";
import { Grid } from "ui/primitives";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { CharacterCard } from "./CharacterCard";

const [kira] = sampleCharacters;

const meta: Meta<typeof CharacterCard> = {
  title: "Game/CharacterCard",
  component: CharacterCard,
  args: {
    name: kira.name,
    playerName: kira.playerName,
    onOpen: () => {},
  },
  render: (args) => (
    <Grid maxWidth="380px">
      <CharacterCard {...args} />
    </Grid>
  ),
};

export default meta;
type Story = StoryObj<typeof CharacterCard>;

export const Playground: Story = {};

/**
 * A game's Characters tab with a second screen on: each card opens the
 * character, and its Open on Screen button stays its own.
 */
export const Party: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2, xl: 3 }} gap="4" alignItems="start">
      {sampleCharacters.map((character, index) => (
        <CharacterCard
          key={character.id}
          name={character.name}
          playerName={character.playerName}
          onOpen={() => {}}
          actions={
            <Button size="sm" variant="ghost" startIcon={<ArrowSquareOut />}>
              {index === 0 ? "On Screen" : "Open on Screen"}
            </Button>
          }
        />
      ))}
    </Grid>
  ),
};

/** Solo games leave the player out: it is always you. */
export const Solo: Story = {
  args: { playerName: undefined },
};
