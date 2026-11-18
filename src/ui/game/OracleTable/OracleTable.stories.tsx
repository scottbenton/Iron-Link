import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

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

/** Action, a 1 to 100 table, with a rolled row picked out. */
export const Rolled: Story = {
  render: function Render() {
    const [value, setValue] = useState(41);
    const row = findRowForRoll(action.rows, value);
    return (
      <Stack maxWidth="520px" maxHeight="520px" overflow="auto">
        <OracleTable
          oracle={action}
          rolledRowId={row?._id}
          rolledValue={value}
          onRoll={() => setValue(Math.floor(Math.random() * 100) + 1)}
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
