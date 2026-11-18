import { ArrowsClockwise, Copy } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { CharacterPortrait } from "../CharacterPortrait";
import { GameLog, GameLogAuthor, GameLogEntry } from "./GameLog";

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
  { id: "copy", label: "Copy", icon: <Copy />, onClick: fn() },
];

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
    author: guide,
    timestamp: at(0, 18, 40),
    roll: sampleRolls.actionAndTheme,
    guideOnly: true,
  },
  {
    id: "8",
    kind: "message",
    author: guide,
    timestamp: at(0, 18, 41),
    message:
      "Note to self: the raiders are trying to evade the patrols, not fight.",
    guideOnly: true,
  },
  {
    id: "9",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 47),
    roll: sampleRolls.askTheOracleLikely,
  },
  {
    id: "10",
    kind: "roll",
    author: author(senna),
    timestamp: at(0, 18, 55),
    roll: sampleRolls.fulfillYourVowProgress,
  },
];

const meta = {
  title: "Game/GameLog",
  component: GameLog,
  args: { entries: fullLog },
  decorators: [
    (Story) => (
      <Box
        height="640px"
        maxWidth="420px"
        borderWidth="1px"
        borderColor="border.default"
        borderRadius="lg"
        overflow="hidden"
      >
        <Story />
      </Box>
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

export const Empty: Story = {
  args: { entries: [], onSend: fn() },
};

export const Loading: Story = {
  args: { entries: [], loading: true, onSend: fn() },
};

export const ViewerWithoutComposer: Story = {
  args: { entries: fullLog.filter((entry) => !entry.guideOnly) },
};
