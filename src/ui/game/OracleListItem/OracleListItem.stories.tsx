import { PushPin } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useState } from "react";

import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";

import { Box, Stack } from "styled-system/jsx";

import { sampleMoves, starforgedRules } from "../../stories/fixtures/datasworn";
import { MoveListItem } from "../MoveListItem";
import { OracleListItem } from "./OracleListItem";

type Named = { _id: string; name: string };
const core = Object.values(starforgedRules.oracles.core.contents) as Named[];
const vault = starforgedRules.oracles.precursor_vault;
const longOracles = [
  vault.contents.outer_first_look,
  vault.collections.interior.contents.first_look,
  vault.collections.interior.contents.opportunity,
  starforgedRules.oracles.planet.collections.vital.contents.observed_from_space,
  starforgedRules.oracles.character.contents.revealed_aspect,
] as Named[];

const meta: Meta<typeof OracleListItem> = {
  title: "Game/OracleListItem",
  component: OracleListItem,
  args: { name: "Action" },
};

export default meta;
type Story = StoryObj<typeof OracleListItem>;

/** A sidebar panel: 16px padding, a heading, rows 2px apart. */
function Panel(props: { width: string; children: ReactNode }) {
  return (
    <Box
      width={props.width}
      padding="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      background="bg.surface"
    >
      {props.children}
    </Box>
  );
}

function RowList(props: { label: string; children: ReactNode }) {
  return (
    <Stack gap="1">
      <Text variant="h4" as="h3">
        {props.label}
      </Text>
      <Stack as="ul" gap="0.5" margin="0" padding="0">
        {props.children}
      </Stack>
    </Stack>
  );
}

/**
 * Rows as in the oracle drawer: press to roll, the table button to look.
 * The die sits where a move row has its chevron, and the row's hover runs
 * under the table button to the edge.
 */
export const List: Story = {
  render: function Render() {
    const [last, setLast] = useState<string>();
    return (
      <Stack gap="3">
        <Panel width="360px">
          <RowList label="Core oracles">
            {core.map((oracle) => (
              <OracleListItem
                as="li"
                key={oracle._id}
                name={oracle.name}
                onRoll={() => setLast(oracle.name)}
                onViewTable={() => setLast(`${oracle.name} table`)}
              />
            ))}
          </RowList>
        </Panel>
        <Text variant="bodySm" color="muted" role="status">
          {last ? `Opened ${last}` : "Nothing rolled yet"}
        </Text>
      </Stack>
    );
  },
};

/**
 * Moves and oracles in one panel. Both use the same row: 36px, names 12px
 * in, a muted glyph at the end (chevron opens, die rolls), end controls in
 * the same column.
 */
export const BesideMoves: Story = {
  render: () => (
    <Panel width="360px">
      <Stack gap="4">
        <RowList label="Moves">
          {[
            sampleMoves.faceDanger,
            sampleMoves.gatherInformation,
            sampleMoves.strike,
          ].map((move) => (
            <MoveListItem
              as="li"
              key={move._id}
              move={move}
              moveCardProps={{ onRoll: () => {} }}
              secondaryAction={
                <IconButton label={`Pin ${move.name}`} size="sm">
                  <PushPin />
                </IconButton>
              }
            />
          ))}
        </RowList>
        <RowList label="Core oracles">
          {core.slice(0, 3).map((oracle) => (
            <OracleListItem
              as="li"
              key={oracle._id}
              name={oracle.name}
              onRoll={() => {}}
              onViewTable={() => {}}
            />
          ))}
        </RowList>
      </Stack>
    </Panel>
  ),
};

/**
 * Long names in the narrowest sidebar (280px). Names wrap instead of
 * cutting off, and the die and table button stay centred on the row.
 */
export const LongNamesNarrow: Story = {
  render: () => (
    <Panel width="280px">
      <RowList label="Precursor vault">
        {longOracles.map((oracle) => (
          <OracleListItem
            as="li"
            key={oracle._id}
            name={oracle.name}
            onRoll={() => {}}
            onViewTable={() => {}}
          />
        ))}
      </RowList>
    </Panel>
  ),
};

/** Without a table button, and as the open item of a reference list. */
export const States: Story = {
  render: () => (
    <Panel width="320px">
      <RowList label="Core oracles">
        <OracleListItem as="li" name="Action" onRoll={() => {}} />
        <OracleListItem
          as="li"
          name="Theme"
          current
          onRoll={() => {}}
          onViewTable={() => {}}
        />
        <OracleListItem
          as="li"
          name="Descriptor"
          disabled
          onRoll={() => {}}
          onViewTable={() => {}}
        />
        <OracleListItem as="li" name="Focus" render={<a href="#focus" />} />
      </RowList>
    </Panel>
  ),
};

export const Disabled: Story = {
  args: { onRoll: () => {}, onViewTable: () => {}, disabled: true },
  render: (args) => (
    <Panel width="320px">
      <OracleListItem {...args} />
    </Panel>
  ),
};
