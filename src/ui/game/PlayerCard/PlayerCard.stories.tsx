import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "ui/components/Button";
import { Grid } from "ui/primitives";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { PlayerCard } from "./PlayerCard";

const [kira, orrin, senna] = sampleCharacters;
const member = (character: (typeof sampleCharacters)[number]) => ({
  id: character.id,
  name: character.name,
  colorSeed: character.colorSeed,
});

const meta: Meta<typeof PlayerCard> = {
  title: "Game/PlayerCard",
  component: PlayerCard,
  args: { name: "Scott", role: "guide", isYou: true },
  argTypes: {
    role: {
      control: "inline-radio",
      options: [undefined, "guide", "player", "viewer"],
    },
  },
  render: (args) => (
    <Grid maxWidth="380px">
      <PlayerCard {...args} />
    </Grid>
  ),
};

export default meta;
type Story = StoryObj<typeof PlayerCard>;

export const Playground: Story = {};

/** A guided game's players, each with their characters. */
export const Players: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
      <PlayerCard
        name={kira.playerName}
        role="guide"
        isYou
        status="online"
        statusLabel="Online"
        actions={
          <Button size="sm" variant="ghost">
            Leave Game
          </Button>
        }
      />
      <PlayerCard
        name={orrin.playerName}
        role="player"
        status="online"
        statusLabel="Online"
        characters={[member(orrin), member(kira)]}
        actions={
          <Button size="sm" variant="ghost">
            Make Guide
          </Button>
        }
      />
      <PlayerCard
        name={senna.playerName}
        role="player"
        status="away"
        statusLabel="Away"
        characters={[member(senna)]}
      />
      <PlayerCard
        name="Ellis"
        role="viewer"
        status="offline"
        statusLabel="Offline"
      />
    </Grid>
  ),
};
