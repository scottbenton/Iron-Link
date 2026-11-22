import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { classicRules } from "../../docs/fixtures/datasworn";
import { ProgressTrack } from "../../game/ProgressTrack";
import { getProgressScore } from "../../game/ProgressTrack/progress";
import { RollButton } from "../../game/RollButton";
import { getOutcome } from "../../layout/Examples/rollDice";
import { showRollToast } from "./previewRolls";

const fulfillYourVow = classicRules.moves.quest.contents.fulfill_your_vow;

const d10 = () => Math.floor(Math.random() * 10) + 1;

const page = css({
  minHeight: "100dvh",
  padding: { base: "4", sm: "6" },
  background: "bg.surface",
  boxSizing: "border-box",
});

function ProgressTrackPreview() {
  const label = "Find the lost bearer of the Iron Crown";
  const [ticks, setTicks] = useState(12);

  const rollProgress = () => {
    const progressScore = getProgressScore(ticks);
    const challengeDice: [number, number] = [d10(), d10()];
    showRollToast({
      kind: "progress",
      moveName: fulfillYourVow.name,
      trackName: label,
      progressScore,
      challengeDice,
      outcome: getOutcome(progressScore, challengeDice),
    });
  };

  return (
    <Stack className={page} alignItems="flex-start">
      <Stack width="360px" maxWidth="100%">
        <ProgressTrack
          label={label}
          typeLabel="Vow"
          rank="dangerous"
          description="Sworn on the ashes of Thornwall, before the elders."
          ticks={ticks}
          onChange={setTicks}
          headerAction={
            <IconButton label="Vow options" size="sm">
              <DotsThree weight="bold" />
            </IconButton>
          }
          actions={
            <RollButton size="sm" icon={null} onRoll={rollProgress}>
              {fulfillYourVow.name}
            </RollButton>
          }
        />
      </Stack>
    </Stack>
  );
}

const meta = {
  title: "Previews/Progress Track",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A vow: mark progress with the plus, then roll Fulfill Your Vow. */
export const Vow: Story = {
  render: () => <ProgressTrackPreview />,
};
