import { ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { RollTextOverrides, getRollSummary } from "../RollCard/getRollSummary";
import {
  ChallengeRollData,
  RollData,
  getComparedScore,
  getRollCritical,
  isChallengeRoll,
} from "../RollCard/rollTypes";
import { CursedDieValue } from "./CursedDieValue";
import { Die } from "./Die";
import { MomentumChip } from "./MomentumChip";
import { Operator } from "./Operator";
import { ProgressChip } from "./ProgressChip";
import { Term } from "./Term";
import {
  DiceDisplayStrings,
  defaultDiceDisplayStrings,
} from "./diceDisplayStrings";
import { strikeStyles } from "./strikeStyles";

const rootStyles = css({
  "--die-size": "32px",
  "--die-font": "1.0625rem",
  // One gap between every die, sign and number, so "3 + 1 = 4" reads
  // evenly; it also clears the rings drawn outside matched dice.
  "--dice-gap": "token(spacing.2)",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  columnGap: "var(--dice-gap)",
  rowGap: "2",
  minWidth: 0,
  fontVariantNumeric: "tabular-nums",
  "&[data-size=sm]": { "--die-size": "26px", "--die-font": "0.9375rem" },
});

const groupStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--dice-gap)",
  "&[data-struck]": {
    opacity: 0.5,
    "& [data-term-value]": strikeStyles,
  },
});

const challengeGroupStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "var(--dice-gap)",
});

const numberStyles = css({
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  color: "fg.default",
});

/**
 * A stat or adds as its sign and its number, so the sign reads as an
 * operator like "=" ("3 + 1 = 4"), with the caption under the number.
 */
function signedTerm(key: string, value: number, caption?: string) {
  return [
    <Operator key={`${key}-sign`}>{value < 0 ? "\u2212" : "+"}</Operator>,
    <Term key={key} caption={caption}>
      <span className={numberStyles}>{Math.abs(value)}</span>
    </Term>,
  ];
}

/** Colours for the two challenge dice, in place of the status colours. */
export type ChallengeDieColors = [string | undefined, string | undefined];

export interface DiceDisplayProps extends CssProp {
  roll: RollData;
  /** `sm` for compact cards and the game log. */
  size?: "sm" | "md";
  /**
   * Names each term under it (Action, Edge, Score, Challenge). Off by
   * default: the card around the dice already says what was rolled, and
   * the dice read better without. Long names wrap to two lines.
   */
  captions?: boolean;
  /**
   * Colours the two challenge dice, such as Sundered Isles' cinder (red)
   * and wraith (blue). Without it they show the status: green where the
   * score beats a die, red where it doesn't.
   */
  challengeDieColors?: ChallengeDieColors;
  /** Names the two challenge dice in captions, such as Cinder and Wraith. */
  challengeDieNames?: [string, string];
  /**
   * Names the dice for screen readers with the roll's summary. Leave it off
   * when something nearby already reads the summary (a roll card does).
   */
  labelled?: boolean;
  strings?: Partial<DiceDisplayStrings>;
  /** Words for the summary when `labelled`. */
  rollText?: RollTextOverrides;
  className?: string;
}

function getChallengeState(
  roll: ChallengeRollData,
  die: number,
): "beaten" | "held" {
  const score = getComparedScore(roll);
  return score !== undefined && score > die ? "beaten" : "held";
}

/**
 * The dice of a roll. Action rolls show the action die (filled like the
 * progress score's chip) plus stat and adds, then the score against the
 * challenge dice: green where the score beats a die, red where it doesn't. A match rings
 * both challenge dice, green on a strong hit and red on a miss. Burned
 * momentum strikes the action score out and takes its place; negative
 * momentum that cancels the action die strikes the die out in red, and a 1
 * on the action die gets a red ring.
 */
export function DiceDisplay(props: DiceDisplayProps) {
  const {
    roll,
    size = "md",
    captions = false,
    challengeDieColors,
    challengeDieNames,
    labelled,
    strings: stringsProp,
    rollText,
    className,
  } = withCssProp(props);
  const s = { ...defaultDiceDisplayStrings, ...stringsProp };

  const a11y = labelled
    ? { role: "img", "aria-label": getRollSummary(roll, { text: rollText }) }
    : { "aria-hidden": true };

  let left: ReactNode = null;
  let challenge: ReactNode = null;

  if (isChallengeRoll(roll)) {
    const crit = getRollCritical(roll);
    const ring =
      crit ??
      (roll.challengeDice[0] === roll.challengeDice[1] ? "match" : undefined);
    const dice = roll.challengeDice.map((die, index) => {
      const element = (
        <Die
          key={index}
          shape="d10"
          kind="challenge"
          value={die}
          state={getChallengeState(roll, die)}
          ring={ring}
          color={challengeDieColors?.[index]}
        />
      );
      return challengeDieNames ? (
        <Term key={index} caption={challengeDieNames[index]}>
          {element}
        </Term>
      ) : (
        element
      );
    });
    const group = <span className={challengeGroupStyles}>{dice}</span>;
    challenge = challengeDieNames ? (
      group
    ) : (
      <Term caption={s.challengeCaption}>{group}</Term>
    );
  }

  if (roll.kind === "action") {
    const capped = Math.min(roll.actionScore, 10);
    const cancelled = !!roll.negativeMomentumCancelled;
    const terms: ReactNode[] = [
      <Term
        key="die"
        caption={cancelled ? s.cancelledCaption : s.actionCaption}
        tone={cancelled ? "danger" : undefined}
      >
        <Die
          shape="d6"
          kind="action"
          value={roll.actionDie}
          cancelled={cancelled}
          // A 1 matters to some assets and moves ("if you roll a 1 on your
          // action die"), so it gets a red ring. Datasworn doesn't say when.
          ring={
            roll.actionDie === 1 && !cancelled && !roll.momentumBurned
              ? "low"
              : undefined
          }
        />
      </Term>,
    ];
    if (roll.statValue) {
      terms.push(...signedTerm("stat", roll.statValue, roll.statName));
    }
    if (roll.adds) {
      terms.push(...signedTerm("adds", roll.adds, s.addsCaption));
    }
    const equation = (
      <span
        className={groupStyles}
        data-struck={roll.momentumBurned ? "" : undefined}
      >
        {terms}
        {(terms.length > 1 || cancelled) && (
          <>
            <Operator>=</Operator>
            <Term caption={s.scoreCaption}>
              <span className={numberStyles} data-term-value="">
                {capped}
              </span>
            </Term>
          </>
        )}
      </span>
    );
    left = (
      <>
        {equation}
        {roll.momentumBurned ? (
          <Term caption={s.momentumCaption}>
            <MomentumChip value={roll.momentumBurned} />
          </Term>
        ) : null}
      </>
    );
  } else if (roll.kind === "progress") {
    left = (
      <Term caption={s.progressCaption}>
        <ProgressChip value={roll.progressScore} />
      </Term>
    );
  } else if (roll.kind === "clock") {
    left = (
      <Term caption={roll.oddsName}>
        <Die
          shape="d100"
          kind="oracle"
          value={roll.roll}
          ring={roll.match ? "match" : undefined}
        />
      </Term>
    );
  } else {
    const rolls = Array.isArray(roll.roll) ? roll.roll : [roll.roll];
    const partCaptions =
      typeof roll.result === "string"
        ? []
        : roll.result.map((part) => part.label);
    left = (
      <>
        {rolls.map((value, index) => (
          <Term key={index} caption={partCaptions[index] ?? s.oracleCaption}>
            <Die
              shape="d100"
              kind="oracle"
              value={value}
              ring={roll.match && rolls.length === 1 ? "match" : undefined}
            />
          </Term>
        ))}
        {roll.cursedDie ? (
          <Term caption={s.cursedCaption}>
            <Die
              shape="d10"
              value={<CursedDieValue value={roll.cursedDie} />}
              state={roll.cursedDie === 10 ? "cursed" : "quiet"}
            />
          </Term>
        ) : null}
      </>
    );
  }

  return (
    <div
      className={cx(rootStyles, className)}
      data-size={size}
      data-captions={captions || undefined}
      data-kind={roll.kind}
      {...a11y}
    >
      {left}
      {challenge && (
        <>
          <Operator word>{s.versus}</Operator>
          {challenge}
        </>
      )}
    </div>
  );
}
