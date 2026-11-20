import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { PercentileRollData } from "../RollCard/rollTypes";
import { CursedDieValue } from "./CursedDieValue";
import { Die } from "./Die";

const inlineStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  verticalAlign: "middle",
  fontVariantNumeric: "tabular-nums",
});

export interface OracleDiceProps extends CssProp {
  roll: PercentileRollData;
  /** For a shared roll, the table's index: shows that table's d100 only. */
  part?: number;
  /** Leaves out the cursed die (shown once, beside the first table). */
  hideCursedDie?: boolean;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * An oracle's d100 (and cursed die) small enough to sit inline after the
 * result text. Decorative: the card's summary reads the numbers.
 */
export function OracleDice(props: OracleDiceProps) {
  const {
    roll,
    part,
    hideCursedDie,
    size = "xs",
    className,
  } = withCssProp(props);
  const rolls = Array.isArray(roll.roll) ? roll.roll : [roll.roll];
  const shown = part === undefined ? rolls : [rolls[part]];
  const cursedDie = roll.kind === "oracle" ? roll.cursedDie : undefined;
  return (
    <span className={cx(inlineStyles, className)} aria-hidden>
      {shown.map((value, index) => (
        <Die
          key={index}
          shape="d100"
          kind="oracle"
          size={size}
          value={value}
          ring={roll.match && rolls.length === 1 ? "match" : undefined}
        />
      ))}
      {cursedDie && !hideCursedDie ? (
        <Die
          shape="d10"
          size={size}
          value={<CursedDieValue value={cursedDie} />}
          state={cursedDie === 10 ? "cursed" : "quiet"}
        />
      ) : null}
    </span>
  );
}
