import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { sampleMoves } from "../../stories/fixtures/datasworn";
import { MoveCard } from "./MoveCard";

const meta: Meta<typeof MoveCard> = {
  title: "Game/MoveCard",
  component: MoveCard,
  args: { move: sampleMoves.faceDanger, category: "Adventure" },
  render: (args) => (
    <Stack maxWidth="560px">
      <MoveCard {...args} />
    </Stack>
  ),
};

export default meta;
type Story = StoryObj<typeof MoveCard>;

/** Face Danger, rolled with any of five stats. */
export const Playground: Story = {
  render: function Render(args) {
    const [rolled, setRolled] = useState<string>();
    return (
      <Stack gap="3" maxWidth="560px">
        <MoveCard
          {...args}
          onRoll={(option) => setRolled(option.label)}
          rollOptions={[
            { id: "edge", label: "Edge", value: 3 },
            { id: "heart", label: "Heart", value: 2 },
            { id: "iron", label: "Iron", value: 1 },
            { id: "shadow", label: "Shadow", value: 1 },
            { id: "wits", label: "Wits", value: 2 },
          ]}
        />
        <Text variant="bodySm" color="muted" role="status">
          {rolled ? `Rolled +${rolled}` : "Pick a stat to roll"}
        </Text>
      </Stack>
    );
  },
};

/** Without values the options come from the move itself. */
export const StatsFromMove: Story = {
  args: { onRoll: () => {} },
};

/** Ask the Oracle: its odds table in the text and the oracles behind Show oracles. */
export const AskTheOracle: Story = {
  render: function Render(args) {
    const [rolled, setRolled] = useState<Record<string, string>>({});
    return (
      <Stack maxWidth="560px">
        <MoveCard
          {...args}
          move={sampleMoves.askTheOracle}
          category="Fate"
          defaultOraclesShown
          rolledOracleRows={rolled}
          onRollOracle={(oracle) => {
            const rows = oracle.rows;
            const row = rows[Math.floor(Math.random() * rows.length)];
            setRolled((current) => ({ ...current, [oracle._id]: row._id }));
          }}
        />
      </Stack>
    );
  },
};

/** A move with no roll, collapsed until opened. */
export const Collapsible: Story = {
  args: {
    move: sampleMoves.payThePrice,
    category: "Fate",
    collapsible: true,
  },
};
