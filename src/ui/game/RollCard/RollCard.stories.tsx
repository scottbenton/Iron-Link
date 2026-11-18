import { ArrowsClockwise, Copy, Flame } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Grid, HStack, Stack } from "styled-system/jsx";

import { Button } from "../../components/Button";
import { useToast } from "../../components/Toast";
import { sampleRolls } from "../../stories/fixtures/rolls";
import { RollCard } from "./RollCard";
import { getRollSummary } from "./getRollSummary";

const meta = {
  title: "Game/RollCard",
  component: RollCard,
  args: { roll: sampleRolls.faceDangerStrongHit },
  argTypes: {
    roll: {
      control: "select",
      options: Object.keys(sampleRolls),
      mapping: sampleRolls,
    },
    variant: { control: "inline-radio", options: ["default", "compact"] },
  },
} satisfies Meta<typeof RollCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outcomes: Story = {
  render: () => (
    <Grid
      gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      gap="4"
      alignItems="start"
    >
      {Object.entries(sampleRolls).map(([key, roll]) => (
        <RollCard key={key} roll={roll} />
      ))}
    </Grid>
  ),
};

const actions = [
  { id: "reroll", label: "Reroll", icon: <ArrowsClockwise />, onClick: fn() },
  { id: "burn", label: "Burn Momentum", icon: <Flame />, onClick: fn() },
  { id: "copy", label: "Copy", icon: <Copy />, onClick: fn() },
];

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

export const Compact: Story = {
  render: () => (
    <Stack gap="2" maxWidth="360px">
      {Object.entries(sampleRolls).map(([key, roll]) => (
        <RollCard key={key} roll={roll} variant="compact" />
      ))}
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
  const show = (roll: (typeof sampleRolls)[keyof typeof sampleRolls]) =>
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
    </HStack>
  );
}

export const InAToast: Story = {
  render: () => <ToastDemo />,
};

export const Summaries: Story = {
  render: () => (
    <Stack gap="2" maxWidth="640px" fontSize="sm">
      {Object.entries(sampleRolls).map(([key, roll]) => (
        <p key={key}>{getRollSummary(roll)}</p>
      ))}
    </Stack>
  ),
};
