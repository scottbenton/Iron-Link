import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { StatGrid } from "ui/game/StatCard";
import { Stack } from "ui/primitives";

import { sampleMoves } from "../../stories/fixtures/datasworn";
import { MoveCard } from "./MoveCard";
import { getMoveRollOptions } from "./moveData";

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

/**
 * Rolled with stats, a condition meter and an asset's own meter: every
 * action roll shows its value signed.
 */
export const ActionRollWithAssets: Story = {
  args: {
    move: sampleMoves.strike,
    category: "Combat",
    onRoll: () => {},
    rollOptions: [
      { id: "iron", label: "Iron", value: 2, kind: "stat" },
      { id: "edge", label: "Edge", value: 3, kind: "stat" },
      {
        id: "asset:starship",
        label: "Starship Integrity",
        value: 4,
        kind: "asset",
      },
    ],
  },
};

/**
 * A progress roll: one button per track the character can roll, each with
 * its progress score (filled boxes), not a signed value.
 */
export const ProgressRoll: Story = {
  args: {
    move: sampleMoves.fulfillYourVow,
    category: "Quest",
    onRoll: () => {},
    rollOptions: [
      { id: "vow-1", label: "Find my sister", value: 6, kind: "track" },
      { id: "vow-2", label: "Repair the Wayfinder", value: 3, kind: "track" },
      {
        id: "vow-3",
        label: "Bring down the Iron Fist",
        value: 9,
        kind: "track",
      },
    ],
  },
};

/** A progress roll with nothing to roll yet. */
export const ProgressRollNoTracks: Story = {
  args: {
    move: sampleMoves.forgeABond,
    category: "Connection",
    onRoll: () => {},
    noTracksLabel: "No connections to roll",
  },
};

/**
 * Special tracks: Starforged's legacies, rolled as their score. The options
 * come from the move; the app adds each legacy's score.
 */
export const LegacyTracks: Story = {
  args: {
    move: sampleMoves.continueALegacy,
    category: "Legacy",
    onRoll: () => {},
    rollOptions: [
      { id: "quests_legacy", label: "Quests", value: 4, kind: "special" },
      { id: "bonds_legacy", label: "Bonds", value: 2, kind: "special" },
      {
        id: "discoveries_legacy",
        label: "Discoveries",
        value: 7,
        kind: "special",
      },
    ],
  },
};

/** Ironsworn's bonds track, rolled by Write Your Epilogue. */
export const BondsTrack: Story = {
  args: {
    move: sampleMoves.writeYourEpilogue,
    category: "Relationship",
    onRoll: () => {},
    rollOptions: [
      { id: "bonds_track", label: "Bonds", value: 5, kind: "special" },
    ],
  },
};

/** A move with no roll: its text alone. */
export const NoRoll: Story = {
  args: {
    move: sampleMoves.payThePrice,
    category: "Fate",
  },
};

const kiraStats = { edge: 3, heart: 2, iron: 1, shadow: 1, wits: 2 };

/**
 * An idea: the move's stats as stat cards in place of roll buttons, so a
 * move rolls from the same cards as the sheet. The card holds the move with
 * no roll options and a `StatGrid` of the stats its trigger names. Strike
 * offers two, Face Danger all five.
 */
export const WithStatCards: Story = {
  render: function Render() {
    const [rolled, setRolled] = useState<string>();
    return (
      <Stack gap="4" maxWidth="560px">
        {[sampleMoves.strike, sampleMoves.faceDanger].map((move) => (
          <Card key={move._id} padding="md">
            <Stack gap="4">
              <MoveCard move={move} category="Combat" variant="plain" />
              <Stack gap="1.5">
                <Text variant="label" as="span" color="muted">
                  Roll with
                </Text>
                <StatGrid
                  label={`Roll ${move.name} with`}
                  stats={getMoveRollOptions(move)
                    .filter((option) => option.id in kiraStats)
                    .map((option) => ({
                      key: option.id,
                      name: option.label,
                      value: kiraStats[option.id as keyof typeof kiraStats],
                    }))}
                  onRoll={(stat) => setRolled(`${move.name} with ${stat.name}`)}
                />
              </Stack>
            </Stack>
          </Card>
        ))}
        <Text variant="caption" color="muted">
          {rolled ? `Rolled ${rolled}` : "Nothing rolled yet"}
        </Text>
      </Stack>
    );
  },
};
