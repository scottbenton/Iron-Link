import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import { sampleCharacters } from "../../stories/fixtures/characters";
import { starforgedRules } from "../../stories/fixtures/datasworn";
import { Button } from "../Button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "./Table";

interface OracleRow {
  roll: { min: number; max: number };
  text: string;
}

const actionOracle: { name: string; rows: OracleRow[] } =
  starforgedRules.oracles.core.contents.action;

const rollRange = (row: OracleRow) =>
  row.roll.min === row.roll.max
    ? `${row.roll.min}`
    : `${row.roll.min}–${row.roll.max}`;

const meta: Meta<typeof Table> = {
  title: "Components/Table",
  component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

/**
 * An oracle table: compact, its header stuck while 100 rows scroll, the
 * rolled row marked.
 */
export const OracleTable: Story = {
  render: function Render() {
    const [rolled, setRolled] = useState(41);
    return (
      <Stack maxWidth="360px" gap="3" alignItems="flex-start">
        <Button onClick={() => setRolled(Math.floor(Math.random() * 100))}>
          Roll Action
        </Button>
        <Table
          density="compact"
          stickyHeader
          maxHeight="360px"
          aria-label={`${actionOracle.name} oracle`}
        >
          <TableCaption>{actionOracle.name}</TableCaption>
          <TableHead>
            <TableRow>
              <TableHeaderCell numeric>Roll</TableHeaderCell>
              <TableHeaderCell>Result</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actionOracle.rows.map((row, index) => (
              <TableRow
                key={index}
                selected={index === rolled}
                aria-current={index === rolled ? "true" : undefined}
              >
                <TableCell numeric>{rollRange(row)}</TableCell>
                <TableCell>{row.text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    );
  },
};

export const Comfortable: Story = {
  render: () => (
    <Stack maxWidth="640px">
      <Table>
        <TableCaption>Party stats</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Character</TableHeaderCell>
            <TableHeaderCell numeric>Edge</TableHeaderCell>
            <TableHeaderCell numeric>Heart</TableHeaderCell>
            <TableHeaderCell numeric>Iron</TableHeaderCell>
            <TableHeaderCell numeric>Shadow</TableHeaderCell>
            <TableHeaderCell numeric>Wits</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleCharacters.map((character) => (
            <TableRow key={character.id}>
              <TableHeaderCell scope="row">{character.name}</TableHeaderCell>
              {Object.entries(character.stats).map(([stat, value]) => (
                <TableCell key={stat} numeric>
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  ),
};
