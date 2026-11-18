import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { sampleMoves } from "../../stories/fixtures/datasworn";
import { MoveListItem } from "./MoveListItem";

const meta: Meta<typeof MoveListItem> = {
  title: "Game/MoveListItem",
  component: MoveListItem,
  args: { move: sampleMoves.faceDanger },
};

export default meta;
type Story = StoryObj<typeof MoveListItem>;

/** A list of moves as in the moves drawer; each opens in place. */
export const List: Story = {
  render: () => (
    <Stack
      gap="0"
      maxWidth="420px"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      overflow="hidden"
    >
      {[
        sampleMoves.faceDanger,
        sampleMoves.gatherInformation,
        sampleMoves.strike,
        sampleMoves.payThePrice,
        sampleMoves.askTheOracle,
      ].map((move) => (
        <MoveListItem
          key={move._id}
          move={move}
          moveCardProps={{ onRoll: () => {} }}
        />
      ))}
    </Stack>
  ),
};

export const Expanded: Story = {
  args: { defaultExpanded: true, moveCardProps: { onRoll: () => {} } },
  render: (args) => (
    <Stack maxWidth="420px">
      <MoveListItem {...args} />
    </Stack>
  ),
};
