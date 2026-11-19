import { ArrowSquareOut } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "ui/components/Button";
import { Grid } from "ui/primitives";

import {
  SampleCharacter,
  sampleCharacters,
} from "../../stories/fixtures/characters";
import { CharacterCard, CharacterCardStat } from "./CharacterCard";

const [kira] = sampleCharacters;

function statsOf(character: SampleCharacter): CharacterCardStat[] {
  return [
    { label: "Edge", value: character.stats.edge },
    { label: "Heart", value: character.stats.heart },
    { label: "Iron", value: character.stats.iron },
    { label: "Shadow", value: character.stats.shadow },
    { label: "Wits", value: character.stats.wits },
  ];
}

function metersOf(character: SampleCharacter): CharacterCardStat[] {
  return [
    { label: "Health", value: character.meters.health, max: 5 },
    { label: "Spirit", value: character.meters.spirit, max: 5 },
    { label: "Supply", value: character.meters.supply, max: 5 },
    { label: "Momentum", value: character.meters.momentum, max: 10 },
  ];
}

const meta: Meta<typeof CharacterCard> = {
  title: "Game/CharacterCard",
  component: CharacterCard,
  args: {
    name: kira.name,
    playerName: kira.playerName,
    colorSeed: kira.colorSeed,
    stats: statsOf(kira),
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

/** A game's party: each card opens the character, its action stays its own. */
export const Party: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2, xl: 3 }} gap="4" alignItems="start">
      {sampleCharacters.map((character, index) => (
        <CharacterCard
          key={character.id}
          name={character.name}
          playerName={character.playerName}
          colorSeed={character.colorSeed}
          status={index === 2 ? "offline" : "online"}
          statusLabel={index === 2 ? "Offline" : "Online"}
          stats={metersOf(character)}
          statsLabel="Meters"
          onOpen={() => {}}
          actions={
            <Button size="sm" variant="ghost" startIcon={<ArrowSquareOut />}>
              Open on Screen
            </Button>
          }
        />
      ))}
    </Grid>
  ),
};

/** Solo: no player, a subtitle instead. */
export const Solo: Story = {
  args: { playerName: undefined, subtitle: "Starforged · Solo" },
};
