import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "ui/components/Button";
import { Grid } from "ui/primitives";
import { SchemeName } from "ui/theme";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { PlayerCard } from "./PlayerCard";

const [kira, orrin, senna] = sampleCharacters;
const member = (
  character: (typeof sampleCharacters)[number],
  colorScheme?: SchemeName,
) => ({
  id: character.id,
  name: character.name,
  colorScheme,
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

/**
 * A guided game's players: the dot is their presence (online, away or
 * offline), the role chip and their characters sit under the name, and the
 * actions end the row. Character portraits are ringed in each character's
 * own theme, gray when it has none.
 */
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
        characters={[member(orrin, "myriad"), member(kira, "cinder")]}
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

/**
 * In a narrow column (under 340px) the actions go on their own line across
 * the card, at its end, so the name keeps the row's width and two actions
 * still fit side by side.
 */
export const Narrow: Story = {
  args: {
    name: orrin.playerName,
    role: "player",
    isYou: false,
    status: "online",
    statusLabel: "Online",
    characters: [member(orrin, "myriad"), member(kira, "cinder")],
    actions: (
      <>
        <Button size="sm" variant="ghost">
          Make Guide
        </Button>
        <Button size="sm" variant="ghost">
          Kick Player
        </Button>
      </>
    ),
  },
  render: (args) => (
    <Grid maxWidth="300px">
      <PlayerCard {...args} />
    </Grid>
  ),
};
