/**
 * Each die motion on the real things that roll, to see it with their own
 * press and hover: a roll button, a stat card, a meter and an oracle row.
 * Press any of them; each row sets its motion through
 * `DieFaceMotionContext`. Goes with the options once one is chosen.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { ConditionMeter } from "../ConditionMeter";
import { OracleListItem } from "../OracleListItem";
import { RollButton } from "../RollButton";
import { StatCard } from "../StatCard";
import { DieFaceMotion, DieFaceMotionContext } from "./DieFace";

const meta: Meta = {
  title: "Game/DieFace on buttons",
};

export default meta;
type Story = StoryObj;

const motions: { motion: DieFaceMotion; name: string }[] = [
  { motion: "swap", name: "Swap" },
  { motion: "tilt", name: "Tilt" },
  { motion: "pop", name: "Pop" },
  { motion: "cycle", name: "Cycle" },
  { motion: "fade", name: "Fade" },
];

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), max-content))",
  alignItems: "center",
  gap: "4",
  paddingBlock: "3",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const oracleStyles = css({ width: "15rem", listStyle: "none" });

const noop = () => {};

function MotionRow(props: { motion: DieFaceMotion; name: string }) {
  const { motion, name } = props;
  return (
    <DieFaceMotionContext.Provider value={motion}>
      <section className={rowStyles} aria-label={name}>
        <Text variant="label">{name}</Text>
        <RollButton onClick={noop}>Roll +Edge</RollButton>
        <StatCard name="Edge" value={3} onRoll={noop} />
        <ConditionMeter
          label="Health"
          value={4}
          max={5}
          onChange={noop}
          onRoll={noop}
        />
        <ul className={oracleStyles}>
          <OracleListItem as="li" name="Action" onRoll={noop} />
        </ul>
      </section>
    </DieFaceMotionContext.Provider>
  );
}

/** One row per motion. Press a button, card, meter or row to roll it. */
export const AllMotions: Story = {
  name: "All motions",
  render: () => (
    <Stack gap="0">
      {motions.map((option) => (
        <MotionRow key={option.motion} {...option} />
      ))}
    </Stack>
  ),
};
