import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, Stack } from "ui/primitives";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import { OracleTextField } from "./OracleTextField";

interface OracleRow {
  roll: { min: number; max: number } | null;
  text: string;
}

/** Rolls 1d100 on a Starforged oracle table from the fixtures. */
function rollTable(rows: OracleRow[]) {
  const roll = Math.floor(Math.random() * 100) + 1;
  const row = rows.find(
    (candidate) =>
      candidate.roll &&
      roll >= candidate.roll.min &&
      roll <= candidate.roll.max,
  );
  return row?.text;
}

const oracles = starforgedRules.oracles;
const settlementName: OracleRow[] = oracles.settlement.contents.name.rows;
const givenName: OracleRow[] =
  oracles.character.collections.name.contents.given_name.rows;
const familyName: OracleRow[] =
  oracles.character.collections.name.contents.family_name.rows;
const callsign: OracleRow[] =
  oracles.character.collections.name.contents.callsign.rows;
const settlementTrouble: OracleRow[] = oracles.settlement.contents.trouble.rows;
const settlementAuthority: OracleRow[] =
  oracles.settlement.contents.authority.rows;

/** Given name and family name, rolled and joined, as the app does. */
const rollCharacterName = () =>
  [rollTable(givenName), rollTable(familyName)].filter(Boolean).join(" ");

const meta = {
  title: "Game/OracleTextField",
  component: OracleTextField,
  args: {
    label: "Settlement Name",
    oracleName: "Settlement Name",
    placeholder: "Bleakhold",
    onRoll: () => rollTable(settlementName),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["outline", "quiet"] },
  },
  decorators: [
    (Story) => (
      <Stack maxWidth="380px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof OracleTextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Press the die to roll Starforged's Settlement Name oracle into the field.
 * The button is named "Roll Settlement Name", and a screen reader hears
 * "Updated Settlement Name to ..." after each roll. Focus stays on the die,
 * so Enter rolls again.
 */
export const Playground: Story = {};

/** Creating a character: a name rolled from two tables, and a callsign. */
export const CharacterDetails: Story = {
  render: function Render() {
    const [name, setName] = useState("");
    const [sign, setSign] = useState("");
    return (
      <Grid columns={{ base: 1, sm: 2 }} gap="4">
        <OracleTextField
          label="Character Name"
          oracleName="Character Name"
          required
          value={name}
          onValueChange={setName}
          onRoll={rollCharacterName}
          clearable
        />
        <OracleTextField
          label="Callsign"
          oracleName="Callsign"
          description="Optional."
          value={sign}
          onValueChange={setSign}
          onRoll={() => rollTable(callsign)}
        />
      </Grid>
    );
  },
};

/**
 * `size="sm"` with `variant="quiet"`, as in a world entry's details: the
 * values read as text, and the die stays at the end of each field. A
 * read-only or disabled field has no die.
 */
export const QuietDetails: Story = {
  render: () => (
    <Stack
      gap="3"
      padding="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      background="bg.surface"
    >
      <OracleTextField
        size="sm"
        variant="quiet"
        label="Name"
        oracleName="Settlement Name"
        defaultValue="Bleakhold"
        onRoll={() => rollTable(settlementName)}
      />
      <OracleTextField
        size="sm"
        variant="quiet"
        label="Authority"
        oracleName="Settlement Authority"
        placeholder="Empty"
        onRoll={() => rollTable(settlementAuthority)}
      />
      <OracleTextField
        size="sm"
        variant="quiet"
        label="Trouble"
        oracleName="Settlement Trouble"
        placeholder="Empty"
        onRoll={() => rollTable(settlementTrouble)}
      />
      <OracleTextField
        size="sm"
        variant="quiet"
        label="Founded By"
        oracleName="Character Name"
        defaultValue="Kayu Stonehand"
        readOnly
        onRoll={rollCharacterName}
      />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <OracleTextField
        label="Settlement Name"
        oracleName="Settlement Name"
        required
        error="Name the settlement before you save it."
        onRoll={() => rollTable(settlementName)}
      />
      <OracleTextField
        label="Settlement Name"
        oracleName="Settlement Name"
        defaultValue="Ironhome"
        disabled
        onRoll={() => rollTable(settlementName)}
      />
    </Stack>
  ),
};
