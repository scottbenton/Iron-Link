import { PushPin } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode } from "react";

import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";

import { Box, Stack } from "styled-system/jsx";

import { sampleMoves, starforgedMove } from "../../stories/fixtures/datasworn";
import { MoveListItem } from "./MoveListItem";

const meta: Meta<typeof MoveListItem> = {
  title: "Game/MoveListItem",
  component: MoveListItem,
  args: { move: sampleMoves.faceDanger },
};

export default meta;
type Story = StoryObj<typeof MoveListItem>;

/** A sidebar panel: 16px padding, a heading, rows 2px apart. */
function Panel(props: { width: string; label: string; children: ReactNode }) {
  return (
    <Box
      width={props.width}
      padding="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      background="bg.surface"
    >
      <Stack gap="1">
        <Text variant="h4" as="h3">
          {props.label}
        </Text>
        <Stack as="ul" gap="0.5" margin="0" padding="0">
          {props.children}
        </Stack>
      </Stack>
    </Box>
  );
}

const pin = (name: string) => (
  <IconButton label={`Pin ${name}`} size="sm">
    <PushPin />
  </IconButton>
);

/** A list of moves as in the moves drawer; each opens in place. */
export const List: Story = {
  render: () => (
    <Panel width="360px" label="Moves">
      {[
        sampleMoves.faceDanger,
        sampleMoves.gatherInformation,
        sampleMoves.strike,
        sampleMoves.payThePrice,
        sampleMoves.askTheOracle,
      ].map((move) => (
        <MoveListItem
          as="li"
          key={move._id}
          move={move}
          moveCardProps={{ onRoll: () => {} }}
        />
      ))}
    </Panel>
  ),
};

/**
 * Open, the row and the move share one inset frame, and the move's text
 * starts under its name.
 */
export const Expanded: Story = {
  render: () => (
    <Panel width="360px" label="Adventure moves">
      <MoveListItem
        as="li"
        move={sampleMoves.faceDanger}
        defaultExpanded
        moveCardProps={{ onRoll: () => {} }}
        secondaryAction={pin(sampleMoves.faceDanger.name)}
      />
      <MoveListItem
        as="li"
        move={sampleMoves.gatherInformation}
        moveCardProps={{ onRoll: () => {} }}
        secondaryAction={pin(sampleMoves.gatherInformation.name)}
      />
    </Panel>
  ),
};

const longMoves = [
  starforgedMove("connection", "develop_your_relationship"),
  starforgedMove("exploration", "undertake_an_expedition"),
  starforgedMove("combat", "take_decisive_action"),
  starforgedMove("suffer", "companion_takes_a_hit"),
  starforgedMove("legacy", "continue_a_legacy"),
];

/**
 * Long names in the narrowest sidebar (280px), with Pin buttons. Names wrap
 * instead of cutting off; the chevron and Pin stay centred on the row.
 */
export const LongNamesNarrow: Story = {
  render: () => (
    <Panel width="280px" label="Moves">
      {longMoves.map((move) => (
        <MoveListItem
          as="li"
          key={move._id}
          move={move}
          moveCardProps={{ onRoll: () => {} }}
          secondaryAction={pin(move.name)}
        />
      ))}
    </Panel>
  ),
};

/** Link rows for a reference page: no chevron, the open page marked. */
export const Links: Story = {
  render: () => (
    <Panel width="320px" label="Combat moves">
      {[
        starforgedMove("combat", "enter_the_fray"),
        starforgedMove("combat", "gain_ground"),
        starforgedMove("combat", "react_under_fire"),
        sampleMoves.strike,
      ].map((move, index) => (
        <MoveListItem
          as="li"
          key={move._id}
          move={move}
          render={<a href={`#${move._id}`} />}
          current={index === 2}
        />
      ))}
    </Panel>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Panel width="320px" label="Moves">
      <MoveListItem as="li" move={sampleMoves.faceDanger} disabled />
    </Panel>
  ),
};
