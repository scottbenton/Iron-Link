import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { classicRules } from "../../docs/fixtures/datasworn";
import { RollButton } from "../../game/RollButton";
import { StatGrid } from "../../game/StatCard";
import { previewCharacter, usePreviewRolls } from "./previewRolls";

const move = (category: string, key: string) =>
  classicRules.moves[category].contents[key];

const moveRolls = [
  { move: move("adventure", "face_danger"), stat: "edge" },
  { move: move("adventure", "secure_an_advantage"), stat: "wits" },
  { move: move("combat", "strike"), stat: "iron" },
  { move: move("relationship", "compel"), stat: "heart" },
] as const;

const stats = (["edge", "heart", "iron", "shadow", "wits"] as const).map(
  (key) => ({
    key,
    name: key[0].toUpperCase() + key.slice(1),
    value: previewCharacter.stats[key],
  }),
);

const page = css({
  minHeight: "100dvh",
  padding: { base: "4", sm: "6" },
  background: "bg.surface",
  boxSizing: "border-box",
});

function RollSnackbarsPreview() {
  const { roll } = usePreviewRolls();
  return (
    <Stack gap="6" className={page}>
      <Stack gap="2" maxWidth="360px">
        <Text variant="label" as="h2" color="muted">
          Stats
        </Text>
        <StatGrid
          stats={stats}
          onRoll={(stat) => roll(stat.name, stat.value)}
        />
      </Stack>
      <Stack gap="2">
        <Text variant="label" as="h2" color="muted">
          Moves
        </Text>
        <HStack gap="3" flexWrap="wrap">
          {moveRolls.map(({ move, stat }) => {
            const name = stat[0].toUpperCase() + stat.slice(1);
            return (
              <RollButton
                key={move._id}
                onRoll={() =>
                  roll(name, previewCharacter.stats[stat], move.name)
                }
              >
                {`${move.name} +${name}`}
              </RollButton>
            );
          })}
        </HStack>
      </Stack>
      <Text color="muted" css={{ maxWidth: "52ch" }}>
        Press a stat or a move. Each roll lands as a card in the corner; the
        newest stays in front, and a card goes away only when you dismiss it.
      </Text>
    </Stack>
  );
}

const meta = {
  title: "Previews/Roll Snackbars",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Roll buttons for an Ironsworn character, with results in the toast stack. */
export const RollAndSeeTheResult: Story = {
  name: "Roll and see the result",
  render: () => <RollSnackbarsPreview />,
};
