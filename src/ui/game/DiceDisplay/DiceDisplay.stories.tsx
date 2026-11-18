import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode } from "react";

import { Grid, Stack } from "ui/primitives";

import { Text } from "../../components/Text";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { allRolls, extraRolls } from "../RollCard/RollCard.fixtures";
import { ChallengeRollData } from "../RollCard/rollTypes";
import { DiceDisplay, DiceNumbers, OracleDice } from "./DiceDisplay";

const meta = {
  title: "Game/DiceDisplay",
  component: DiceDisplay,
  args: { roll: sampleRolls.faceDangerStrongHit, labelled: true },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    roll: {
      control: "select",
      options: Object.keys(allRolls),
      mapping: allRolls,
    },
  },
} satisfies Meta<typeof DiceDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function Row(props: { label: string; children: ReactNode }) {
  return (
    <Grid
      gridTemplateColumns={{ base: "1fr", sm: "200px 1fr" }}
      gap="2"
      alignItems="start"
    >
      <Text variant="caption" color="muted">
        {props.label}
      </Text>
      {props.children}
    </Grid>
  );
}

/** Every sample roll with bare dice, the default. */
export const EveryRoll: Story = {
  render: () => (
    <Stack gap="5">
      {Object.entries(allRolls).map(([key, roll]) => (
        <Row key={key} label={key}>
          <DiceDisplay roll={roll} labelled />
        </Row>
      ))}
    </Stack>
  ),
};

/** The same with `captions`, naming each term. */
export const WithCaptions: Story = {
  render: () => (
    <Stack gap="5">
      {Object.entries(allRolls).map(([key, roll]) => (
        <Row key={key} label={key}>
          <DiceDisplay roll={roll} captions labelled />
        </Row>
      ))}
    </Stack>
  ),
};

/** Small dice for compact cards and the game log. */
export const Small: Story = {
  render: () => (
    <Stack gap="3">
      {Object.entries(allRolls).map(([key, roll]) => (
        <Row key={key} label={key}>
          <DiceDisplay roll={roll} size="sm" labelled />
        </Row>
      ))}
    </Stack>
  ),
};

/**
 * Long captions wrap to two lines under their term, then end in an
 * ellipsis, so the dice never spread apart.
 */
export const LongCaptions: Story = {
  render: () => (
    <Stack gap="5" maxWidth="420px">
      <Row label="Long stat, adds, capped score">
        <DiceDisplay roll={extraRolls.compelProtocolBot} captions labelled />
      </Row>
      <Row label="Stat plus an asset's +1">
        <DiceDisplay
          roll={extraRolls.secureAnAdvantageShadow}
          captions
          labelled
        />
      </Row>
      <Row label="Table names in a shared roll">
        <DiceDisplay
          roll={{
            kind: "oracle",
            oracleName: "Character Name",
            category: "Character Oracles",
            roll: [12, 47, 12],
            result: [
              { label: "Given Name", text: "Astrid" },
              { label: "Callsign", text: "Hush" },
              { label: "Family Name", text: "Ripley" },
            ],
          }}
          captions
          labelled
        />
      </Row>
      <Row label="Clock odds">
        <DiceDisplay roll={extraRolls.clockAdvances} captions labelled />
      </Row>
      <Row label="Special track">
        <DiceDisplay roll={extraRolls.continueALegacyQuests} captions />
      </Row>
    </Stack>
  ),
};

/**
 * A match on the challenge dice rings both dice: green for a strong hit
 * with a match, red for a miss with a match. An oracle match uses the
 * accent colour.
 */
export const Criticals: Story = {
  render: () => (
    <Stack gap="5">
      <Row label="Strong hit with a match">
        <DiceDisplay roll={sampleRolls.faceDangerStrongHit} labelled />
      </Row>
      <Row label="Miss with a match">
        <DiceDisplay roll={extraRolls.withstandDamageMissMatch} labelled />
      </Row>
      <Row label="Progress, strong hit with a match">
        <DiceDisplay roll={sampleRolls.takeDecisiveActionProgress} labelled />
      </Row>
      <Row label="Small">
        <DiceDisplay
          roll={extraRolls.withstandDamageMissMatch}
          size="sm"
          labelled
        />
      </Row>
      <Row label="Oracle match">
        <DiceDisplay roll={sampleRolls.askTheOracleLikely} labelled />
      </Row>
    </Stack>
  ),
};

/**
 * Negative momentum matching the action die cancels it: struck out in red,
 * counted as 0.
 */
export const NegativeMomentum: Story = {
  render: () => (
    <Stack gap="5">
      <Row label="Bare">
        <DiceDisplay roll={extraRolls.faceDangerNegativeMomentum} labelled />
      </Row>
      <Row label="Captions">
        <DiceDisplay
          roll={extraRolls.faceDangerNegativeMomentum}
          captions
          labelled
        />
      </Row>
      <Row label="Burned momentum, for comparison">
        <DiceDisplay roll={sampleRolls.compelBurnedMomentum} captions />
      </Row>
    </Stack>
  ),
};

const cinder = "var(--colors-danger-fg)";
const wraith = "var(--colors-info-fg)";

/**
 * `challengeDieColors` colours the dice in place of the status colours,
 * for Sundered Isles' cinder and wraith. A beaten die is solid, a held one
 * outlined. Status colour stays the default.
 */
export const ColouredChallengeDice: Story = {
  render: () => (
    <Stack gap="5">
      <Row label="Status colours (default)">
        <DiceDisplay roll={sampleRolls.secureAnAdvantageWeakHit} labelled />
      </Row>
      <Row label="Cinder and wraith, weak hit">
        <DiceDisplay
          roll={sampleRolls.secureAnAdvantageWeakHit}
          challengeDieColors={[cinder, wraith]}
          challengeDieNames={["Cinder", "Wraith"]}
          captions
          labelled
        />
      </Row>
      <Row label="Strong hit">
        <DiceDisplay
          roll={extraRolls.secureAnAdvantageShadow}
          challengeDieColors={[cinder, wraith]}
          labelled
        />
      </Row>
      <Row label="Miss">
        <DiceDisplay
          roll={sampleRolls.strikeMiss}
          challengeDieColors={[cinder, wraith]}
          labelled
        />
      </Row>
      <Row label="Miss with a match">
        <DiceDisplay
          roll={extraRolls.withstandDamageMissMatch}
          challengeDieColors={[cinder, wraith]}
          labelled
        />
      </Row>
    </Stack>
  ),
};

/** Sundered Isles' cursed die: a skull on 10, quiet otherwise. */
export const CursedDie: Story = {
  render: () => (
    <Stack gap="5">
      <Row label="10: cursed table replaces">
        <DiceDisplay roll={extraRolls.islandNameCursed} captions labelled />
      </Row>
      <Row label="10: cursed table adds">
        <DiceDisplay roll={extraRolls.crewCursedAdds} captions labelled />
      </Row>
      <Row label="Short of 10">
        <DiceDisplay roll={extraRolls.offshoreObservations} captions labelled />
      </Row>
    </Stack>
  ),
};

/** The inline pieces roll cards use in compact and quiet layouts. */
export const InlinePieces: Story = {
  render: () => {
    const challenge: ChallengeRollData[] = [
      sampleRolls.faceDangerStrongHit,
      sampleRolls.strikeMiss,
      sampleRolls.compelBurnedMomentum,
      sampleRolls.fulfillYourVowProgress,
    ];
    return (
      <Stack gap="4">
        {challenge.map((roll, index) => (
          <Row key={index} label="DiceNumbers">
            <DiceNumbers roll={roll} />
          </Row>
        ))}
        <Row label="OracleDice">
          <OracleDice roll={sampleRolls.spaceSighting} />
        </Row>
        <Row label="OracleDice, cursed">
          <OracleDice roll={extraRolls.islandNameCursed} />
        </Row>
        <Row label="OracleDice, match">
          <OracleDice roll={extraRolls.clockAdvances} />
        </Row>
      </Stack>
    );
  },
};
