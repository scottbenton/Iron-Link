import { ArrowsClockwise, Copy, Flame } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode, useState } from "react";
import { fn } from "storybook/test";

import { Grid, HStack, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { Text } from "../../components/Text";
import { useToast } from "../../components/Toast";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { RollCard, RollCardProps } from "./RollCard";
import { allRolls, extraRolls, rollsByType } from "./RollCard.fixtures";
import { getRollSummary } from "./getRollSummary";
import { RollData } from "./rollTypes";

const meta = {
  title: "Game/RollCard",
  component: RollCard,
  args: { roll: sampleRolls.faceDangerStrongHit },
  argTypes: {
    roll: {
      control: "select",
      options: Object.keys(allRolls),
      mapping: allRolls,
    },
    variant: { control: "inline-radio", options: ["default", "compact"] },
    diceDetail: {
      control: "inline-radio",
      options: ["dice", "captions"],
    },
  },
} satisfies Meta<typeof RollCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function Section(props: { title: string; children: ReactNode }) {
  return (
    <Stack gap="3">
      <Text variant="label" as="h2" color="muted">
        {props.title}
      </Text>
      {props.children}
    </Stack>
  );
}

function CardGrid(props: { children: ReactNode }) {
  return (
    <Grid
      gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      gap="4"
      alignItems="start"
    >
      {props.children}
    </Grid>
  );
}

function Labelled(props: { label: string; children: ReactNode }) {
  return (
    <Stack gap="1.5">
      <Text variant="caption" color="muted">
        {props.label}
      </Text>
      {props.children}
    </Stack>
  );
}

function EveryType(props: Partial<RollCardProps>) {
  return (
    <Stack gap="8">
      {Object.entries(rollsByType).map(([type, rolls]) => (
        <Section key={type} title={type}>
          <CardGrid>
            {Object.entries(rolls).map(([label, roll]) => (
              <Labelled key={label} label={label}>
                <RollCard roll={roll as RollData} {...props} />
              </Labelled>
            ))}
          </CardGrid>
        </Section>
      ))}
    </Stack>
  );
}

/**
 * Every roll the app logs: action, progress, special track (legacy tracks
 * and Ironsworn bonds), oracle, cursed oracle and clock rolls.
 */
export const EveryRollType: Story = {
  render: () => <EveryType />,
};

/** The same rolls as compact game log cards. */
export const EveryRollTypeCompact: Story = {
  render: () => <EveryType variant="compact" />,
};

/**
 * The outcome is the loudest thing on the card. A match is a critical: the
 * rules call it a "strong hit with a match" (green ring and chip) or a
 * "miss with a match" (red). Both dice show the same number, so a weak hit
 * can never match.
 */
export const OutcomesAndMatches: Story = {
  render: () => (
    <CardGrid>
      <Labelled label="Strong hit with a match">
        <RollCard roll={sampleRolls.faceDangerStrongHit} />
      </Labelled>
      <Labelled label="Weak hit">
        <RollCard roll={sampleRolls.secureAnAdvantageWeakHit} />
      </Labelled>
      <Labelled label="Miss">
        <RollCard roll={sampleRolls.strikeMiss} />
      </Labelled>
      <Labelled label="Miss with a match">
        <RollCard roll={extraRolls.withstandDamageMissMatch} />
      </Labelled>
      <Labelled label="Progress, strong hit with a match">
        <RollCard roll={sampleRolls.takeDecisiveActionProgress} />
      </Labelled>
      <Labelled label="Oracle match (accent ring)">
        <RollCard roll={sampleRolls.askTheOracleLikely} />
      </Labelled>
    </CardGrid>
  ),
};

/**
 * Negative momentum cancels the action die when its absolute value matches
 * the die (momentum -4, a 4 on the die): the die counts as 0. The die is
 * struck out in red and the card says why.
 */
export const NegativeMomentumCancels: Story = {
  render: () => (
    <CardGrid>
      <Labelled label="Bare dice">
        <RollCard roll={extraRolls.faceDangerNegativeMomentum} />
      </Labelled>
      <Labelled label="With captions">
        <RollCard
          roll={extraRolls.faceDangerNegativeMomentum}
          diceDetail="captions"
        />
      </Labelled>
      <Labelled label="Compact">
        <RollCard
          roll={extraRolls.faceDangerNegativeMomentum}
          variant="compact"
        />
      </Labelled>
    </CardGrid>
  ),
};

/**
 * A 1 on the action die gets a red ring on the d6. Datasworn doesn't say when
 * a 1 matters (only some assets and moves care), so the chip is opt-in:
 * `oneOnActionDieMatters` for when the app knows, such as an asset of the
 * character's that mentions it.
 */
export const OneOnTheActionDie: Story = {
  render: () => (
    <CardGrid>
      <Labelled label="Ring only (default)">
        <RollCard roll={sampleRolls.endureHarmOne} />
      </Labelled>
      <Labelled label="With the chip, when it matters">
        <RollCard roll={sampleRolls.endureHarmOne} oneOnActionDieMatters />
      </Labelled>
      <Labelled label="Compact">
        <RollCard roll={sampleRolls.endureHarmOne} variant="compact" />
      </Labelled>
    </CardGrid>
  ),
};

/**
 * Sundered Isles' cursed die. A 10 brings the curse: the cursed table
 * replaces the result (Cursed Island Name for Island Name) or adds to it
 * (Cursed Crew). Short of 10 the die shows quietly and nothing changes.
 */
export const CursedResults: Story = {
  render: () => (
    <Stack gap="6">
      <CardGrid>
        <Labelled label="Cursed table replaces the result">
          <RollCard roll={extraRolls.islandNameCursed} />
        </Labelled>
        <Labelled label="Cursed table adds a result">
          <RollCard roll={extraRolls.crewCursedAdds} />
        </Labelled>
        <Labelled label="Cursed die short of 10">
          <RollCard roll={extraRolls.offshoreObservations} />
        </Labelled>
      </CardGrid>
      <Stack gap="2" maxWidth="360px">
        <RollCard roll={extraRolls.islandNameCursed} variant="compact" />
        <RollCard roll={extraRolls.crewCursedAdds} variant="compact" />
        <RollCard roll={extraRolls.offshoreObservations} variant="compact" />
      </Stack>
    </Stack>
  ),
};

/**
 * Oracle results at body size. Compact cards put the roll inline after the
 * result instead of on its own line.
 */
export const OracleText: Story = {
  render: () => (
    <Stack gap="6">
      <CardGrid>
        <RollCard roll={extraRolls.sectorTrouble} />
        <RollCard roll={extraRolls.withstandDamageTable} />
        <RollCard roll={sampleRolls.actionAndTheme} />
      </CardGrid>
      <Stack gap="2" maxWidth="360px">
        <RollCard roll={extraRolls.sectorTrouble} variant="compact" />
        <RollCard roll={extraRolls.withstandDamageTable} variant="compact" />
        <RollCard roll={sampleRolls.actionAndTheme} variant="compact" />
        <RollCard roll={sampleRolls.spaceSighting} variant="compact" />
        <RollCard roll={extraRolls.clockAdvances} variant="compact" />
      </Stack>
    </Stack>
  ),
};

/** How much dice to draw: bare dice (the default), or named dice. */
export const DiceDetail: Story = {
  render: () => (
    <Stack gap="6">
      {(
        [
          ["dice", "Dice (the default)"],
          ["captions", "Captions"],
        ] as const
      ).map(([detail, title]) => (
        <Section key={detail} title={title}>
          <CardGrid>
            <RollCard roll={sampleRolls.strikeMiss} diceDetail={detail} />
            <RollCard
              roll={sampleRolls.compelBurnedMomentum}
              diceDetail={detail}
            />
            <RollCard
              roll={sampleRolls.fulfillYourVowProgress}
              diceDetail={detail}
            />
            <RollCard roll={extraRolls.crewCursedAdds} diceDetail={detail} />
          </CardGrid>
        </Section>
      ))}
    </Stack>
  ),
};

const cinderWraith = {
  challengeDieColors: ["var(--colors-danger-fg)", "var(--colors-info-fg)"] as [
    string,
    string,
  ],
  challengeDieNames: ["Cinder", "Wraith"] as [string, string],
};

/**
 * Challenge dice in colours of the caller's: Sundered Isles' cinder (red)
 * and wraith (blue). A beaten die fills with its colour and a held one is
 * only outlined, so the status still reads; the match ring stays green or
 * red by outcome.
 */
export const CinderAndWraith: Story = {
  render: () => (
    <CardGrid>
      <RollCard roll={extraRolls.secureAnAdvantageShadow} {...cinderWraith} />
      <RollCard
        roll={sampleRolls.secureAnAdvantageWeakHit}
        {...cinderWraith}
        diceDetail="captions"
      />
      <RollCard roll={sampleRolls.faceDangerStrongHit} {...cinderWraith} />
      <RollCard roll={extraRolls.withstandDamageMissMatch} {...cinderWraith} />
    </CardGrid>
  ),
};

const actions = [
  { id: "reroll", label: "Reroll", icon: <ArrowsClockwise />, onClick: fn() },
  { id: "burn", label: "Burn Momentum", icon: <Flame />, onClick: fn() },
  { id: "copy", label: "Copy", icon: <Copy />, onClick: fn() },
];

/** Full cards keep labelled action buttons; compact ones use icons. */
export const WithActions: Story = {
  render: () => (
    <Stack gap="4">
      <RollCard
        roll={sampleRolls.strikeMiss}
        actions={actions}
        onDismiss={fn()}
      />
      <RollCard
        roll={sampleRolls.strikeMiss}
        actions={actions}
        variant="compact"
      />
    </Stack>
  ),
};

/**
 * `width="content"` sizes a card to what it shows rather than the row, as
 * the game log does, so short rolls stay short. Long ones wrap at the cap
 * (`--roll-card-max-width`, 440px unless the place sets it).
 */
export const ContentWidth: Story = {
  render: () => (
    <Stack gap="2" maxWidth="560px" alignItems="flex-start">
      <RollCard
        roll={sampleRolls.askTheOracleLikely}
        variant="compact"
        width="content"
      />
      <RollCard
        roll={sampleRolls.faceDangerStrongHit}
        variant="compact"
        width="content"
      />
      <RollCard
        roll={sampleRolls.compelBurnedMomentum}
        variant="compact"
        width="content"
        diceDetail="captions"
      />
      <RollCard
        roll={extraRolls.sectorTrouble}
        variant="compact"
        width="content"
      />
      <RollCard
        roll={extraRolls.compelProtocolBot}
        variant="compact"
        width="content"
        actions={actions}
      />
    </Stack>
  ),
};

/** Long names wrap; the dismiss button keeps its corner. */
export const LongText: Story = {
  render: () => (
    <Stack gap="4" maxWidth="320px">
      <RollCard
        roll={extraRolls.compelProtocolBot}
        diceDetail="captions"
        onDismiss={fn()}
      />
      <RollCard roll={extraRolls.clockAdvances} onDismiss={fn()} />
      <RollCard roll={extraRolls.sectorTrouble} variant="compact" />
    </Stack>
  ),
};

export const Dismissable: Story = {
  render: function Render() {
    const [shown, setShown] = useState(true);
    return shown ? (
      <RollCard
        roll={sampleRolls.askTheOracleLikely}
        onDismiss={() => setShown(false)}
        elevated
        animateIn
      />
    ) : (
      <Button onClick={() => setShown(true)}>Show the roll again</Button>
    );
  },
};

function ToastDemo() {
  const toast = useToast();
  const show = (roll: RollData) =>
    toast.custom(
      ({ dismiss }) => (
        <RollCard roll={roll} onDismiss={dismiss} elevated animateIn />
      ),
      { announcement: getRollSummary(roll) },
    );
  return (
    <HStack gap="2" flexWrap="wrap">
      <Button onClick={() => show(sampleRolls.faceDangerStrongHit)}>
        Roll Face Danger
      </Button>
      <Button onClick={() => show(sampleRolls.fulfillYourVowProgress)}>
        Roll Fulfill Your Vow
      </Button>
      <Button onClick={() => show(sampleRolls.actionAndTheme)}>
        Roll Action and Theme
      </Button>
      <Button onClick={() => show(extraRolls.islandNameCursed)}>
        Roll Island Name
      </Button>
    </HStack>
  );
}

export const InAToast: Story = {
  render: () => <ToastDemo />,
};

/** What screen readers read in place of each card. */
export const Summaries: Story = {
  render: () => (
    <Stack gap="2" maxWidth="640px" fontSize="sm">
      {Object.entries(allRolls).map(([key, roll]) => (
        <p key={key}>{getRollSummary(roll)}</p>
      ))}
    </Stack>
  ),
};
