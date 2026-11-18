import { ArrowsClockwise, Copy, Flame } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useState } from "react";
import { fn } from "storybook/test";

import { Box, Grid, Stack } from "styled-system/jsx";

import { Text } from "../../components/Text";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { CharacterPortrait } from "../CharacterPortrait";
import { extraRolls } from "../RollCard/RollCard.fixtures";
import {
  GameLog,
  GameLogAuthor,
  GameLogDensity,
  GameLogEntry,
} from "./GameLog";

const [kira, orrin, senna] = sampleCharacters;

const author = (
  character: (typeof sampleCharacters)[number],
  isYou = false,
): GameLogAuthor => ({
  name: character.name,
  writtenBy: character.playerName,
  isYou,
  portrait: (
    <CharacterPortrait
      name={character.name}
      colorSeed={character.colorSeed}
      size="sm"
      decorative
    />
  ),
});

const guide: GameLogAuthor = { name: "Jamie", writtenBy: "Guide" };

const at = (daysAgo: number, hours: number, minutes: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const rollActions = [
  { id: "reroll", label: "Reroll", icon: <ArrowsClockwise />, onClick: fn() },
  { id: "burn", label: "Burn Momentum", icon: <Flame />, onClick: fn() },
  { id: "copy", label: "Copy", icon: <Copy />, onClick: fn() },
];

/**
 * A session with every roll type the app logs (action, progress, special
 * track, oracle, cursed oracle, clock) between plain text messages.
 */
const fullLog: GameLogEntry[] = [
  {
    id: "1",
    kind: "message",
    author: guide,
    timestamp: at(3, 19, 2),
    message:
      "The airlock hisses open onto the derelict. Lights flicker somewhere deep inside.",
  },
  {
    id: "2",
    kind: "roll",
    author: author(kira, true),
    timestamp: at(3, 19, 5),
    roll: sampleRolls.spaceSighting,
  },
  {
    id: "3",
    kind: "roll",
    author: author(kira, true),
    timestamp: at(1, 20, 14),
    roll: sampleRolls.faceDangerStrongHit,
    actions: rollActions,
  },
  {
    id: "4",
    kind: "message",
    author: author(kira, true),
    timestamp: at(1, 20, 15),
    message:
      "Kira vaults the collapsing gantry and lands on the far side.\nMarking momentum.",
  },
  {
    id: "5",
    kind: "roll",
    author: author(orrin),
    timestamp: at(1, 20, 21),
    roll: sampleRolls.strikeMiss,
  },
  {
    id: "6",
    kind: "message",
    author: author(orrin),
    timestamp: at(1, 20, 22),
    message: "That did not go well.",
  },
  {
    id: "7",
    kind: "roll",
    author: author(orrin),
    timestamp: at(1, 20, 24),
    roll: extraRolls.withstandDamageMissMatch,
  },
  {
    id: "8",
    kind: "roll",
    author: author(kira, true),
    timestamp: at(1, 20, 30),
    roll: extraRolls.faceDangerNegativeMomentum,
  },
  {
    id: "9",
    kind: "roll",
    author: author(kira, true),
    timestamp: at(1, 20, 31),
    roll: sampleRolls.compelBurnedMomentum,
  },
  {
    id: "10",
    kind: "roll",
    author: guide,
    timestamp: at(0, 18, 40),
    roll: sampleRolls.actionAndTheme,
    guideOnly: true,
  },
  {
    id: "11",
    kind: "message",
    author: guide,
    timestamp: at(0, 18, 41),
    message:
      "Note to self: the raiders are trying to evade the patrols, not fight.",
    guideOnly: true,
  },
  {
    id: "12",
    kind: "roll",
    author: guide,
    timestamp: at(0, 18, 43),
    roll: extraRolls.clockAdvances,
  },
  {
    id: "13",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 47),
    roll: sampleRolls.askTheOracleLikely,
  },
  {
    id: "14",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 50),
    roll: extraRolls.islandNameCursed,
  },
  {
    id: "15",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 51),
    roll: extraRolls.crewCursedAdds,
  },
  {
    id: "16",
    kind: "message",
    author: author(senna),
    timestamp: at(0, 18, 53),
    message:
      "Blight it is. Nobody aboard wants to say the name out loud.\n\nSenna marks the island on the chart anyway, and circles it twice.",
  },
  {
    id: "17",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 55),
    roll: sampleRolls.fulfillYourVowProgress,
  },
  {
    id: "18",
    kind: "roll",
    author: author(kira, true),
    timestamp: at(0, 19, 2),
    roll: extraRolls.continueALegacyQuests,
  },
  {
    id: "19",
    kind: "roll",
    author: author(orrin),
    timestamp: at(0, 19, 6),
    roll: sampleRolls.takeDecisiveActionProgress,
  },
  {
    id: "20",
    kind: "message",
    author: author(orrin),
    timestamp: at(0, 19, 7),
    message: "Got him.",
  },
];

function Frame(props: { children: ReactNode; height?: string }) {
  return (
    <Box
      height={props.height ?? "640px"}
      maxWidth="420px"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      overflow="hidden"
    >
      {props.children}
    </Box>
  );
}

const meta = {
  title: "Game/GameLog",
  component: GameLog,
  args: { entries: fullLog },
  argTypes: {
    density: {
      control: "inline-radio",
      options: ["detailed", "standard", "quiet"],
    },
  },
  decorators: [
    (Story, context) =>
      context.parameters.noFrame ? (
        <Story />
      ) : (
        <Frame>
          <Story />
        </Frame>
      ),
  ],
} satisfies Meta<typeof GameLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullLog: Story = {
  render: function Render(args) {
    const [entries, setEntries] = useState(args.entries);
    return (
      <GameLog
        {...args}
        entries={entries}
        hasMore
        onLoadMore={fn()}
        onSend={(message) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setEntries((current) => [
                ...current,
                {
                  id: `${current.length + 1}`,
                  kind: "message",
                  author: author(kira, true),
                  timestamp: new Date(),
                  message,
                },
              ]);
              resolve();
            }, 400),
          )
        }
      />
    );
  },
};

/** Every die named. The busiest; good for learning the dice. */
export const DensityDetailed: Story = {
  args: { density: "detailed" },
};

/** Bare dice, the default. */
export const DensityStandard: Story = {
  args: { density: "standard" },
};

/**
 * The outcome with the dice as one quiet line of numbers beside it
 * ("7 vs 5 5"), and oracle rolls inline after their result.
 */
export const DensityQuiet: Story = {
  args: { density: "quiet" },
};

/** The three densities side by side, scrolled to the same entries. */
export const CompareDensities: Story = {
  parameters: { noFrame: true, layout: "fullscreen" },
  render: (args) => (
    <Grid
      gridTemplateColumns="repeat(auto-fit, minmax(340px, 1fr))"
      gap="4"
      padding="4"
    >
      {(
        [
          ["detailed", "Detailed"],
          ["standard", "Standard (the default)"],
          ["quiet", "Quiet"],
        ] as [GameLogDensity, string][]
      ).map(([density, title]) => (
        <Stack key={density} gap="2">
          <Text variant="label" as="h2" color="muted">
            {title}
          </Text>
          <Frame height="720px">
            <GameLog {...args} density={density} />
          </Frame>
        </Stack>
      ))}
    </Grid>
  ),
};

/** Only chat: plain text, line breaks kept, a Guide only note. */
export const PlainText: Story = {
  args: {
    entries: fullLog.filter((entry) => entry.kind === "message"),
    onSend: fn(),
  },
};

export const Empty: Story = {
  args: { entries: [], onSend: fn() },
};

export const Loading: Story = {
  args: { entries: [], loading: true, onSend: fn() },
};

export const ViewerWithoutComposer: Story = {
  args: { entries: fullLog.filter((entry) => !entry.guideOnly) },
};
