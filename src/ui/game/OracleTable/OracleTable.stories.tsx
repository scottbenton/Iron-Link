import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";

import { sampleMoves, starforgedRules } from "../../stories/fixtures/datasworn";
import { OracleTable } from "./OracleTable";
import { findRowForRoll } from "./oracleTableData";

const action = starforgedRules.oracles.core.contents.action;
const goal = starforgedRules.oracles.character.contents.goal;

const meta: Meta<typeof OracleTable> = {
  title: "Game/OracleTable",
  component: OracleTable,
  args: { oracle: goal },
  render: (args) => (
    <Stack maxWidth="520px">
      <OracleTable {...args} />
    </Stack>
  ),
};

export default meta;
type Story = StoryObj<typeof OracleTable>;

/** Character Goal: rows covering ranges of the roll. */
export const Playground: Story = {};

/**
 * Action, a 1 to 100 table, with a rolled row picked out. `maxHeight` keeps
 * the name, Roll and the column labels in view while the rows scroll, and
 * each roll scrolls its row into the middle of the box and flashes it, even
 * when it lands on the same row twice.
 */
export const Rolled: Story = {
  render: function Render() {
    const [roll, setRoll] = useState({ value: 41, count: 0 });
    const row = findRowForRoll(action.rows, roll.value);
    return (
      <Stack maxWidth="520px">
        <OracleTable
          oracle={action}
          rolledRowId={row?._id}
          rollKey={roll.count}
          maxHeight="360px"
          onRoll={() =>
            setRoll((current) => ({
              value: Math.floor(Math.random() * 100) + 1,
              count: current.count + 1,
            }))
          }
        />
      </Stack>
    );
  },
};

/**
 * Roll Again lands on the same row every time: the row flashes on each roll,
 * so a repeat still reads as a new result.
 */
export const SameRowTwice: Story = {
  render: function Render() {
    const [count, setCount] = useState(0);
    return (
      <Stack maxWidth="520px">
        <OracleTable
          oracle={goal}
          rolledValue={count ? 50 : undefined}
          rollKey={count}
          onRoll={() => setCount((current) => current + 1)}
          rollLabel="Roll 50"
        />
      </Stack>
    );
  },
};

/** Ask the Oracle's odds, as embedded in the move. */
export const AskTheOracleOdds: Story = {
  args: {
    oracle: sampleMoves.askTheOracle.oracles.likely,
    rolledRowId: sampleMoves.askTheOracle.oracles.likely.rows[0]._id,
  },
};

/** Without its header, as inside rules text. */
export const HiddenHeader: Story = {
  args: { oracle: goal, hideHeader: true },
};
