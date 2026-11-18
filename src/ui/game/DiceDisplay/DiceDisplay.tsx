import { Flame, Skull } from "@phosphor-icons/react";
import { CSSProperties, ReactNode } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { RollTextOverrides, getRollSummary } from "../RollCard/getRollSummary";
import {
  ChallengeRollData,
  PercentileRollData,
  RollCritical,
  RollData,
  getComparedScore,
  getRollCritical,
  isChallengeRoll,
} from "../RollCard/rollTypes";
import { formatSigned } from "../shared/format";
import {
  DiceDisplayStrings,
  defaultDiceDisplayStrings,
} from "./diceDisplayStrings";

const rootStyles = css({
  "--die-size": "32px",
  "--die-font": "1.0625rem",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start",
  columnGap: "1.5",
  rowGap: "2",
  minWidth: 0,
  fontVariantNumeric: "tabular-nums",
  "&[data-size=sm]": { "--die-size": "26px", "--die-font": "0.9375rem" },
});

const groupStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "1",
  "&[data-struck]": {
    opacity: 0.5,
    "& [data-term-value]": {
      textDecoration: "line-through",
      textDecorationThickness: "2px",
    },
  },
});

const challengeGroupStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "1",
  // Room between the crit rings drawn outside each die.
  "&[data-crit]": { gap: "2" },
});

const termStyles = css({
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "0.5",
  minWidth: "var(--die-size)",
});

/**
 * Captions wrap to two lines at most under their term, then clip with an
 * ellipsis, so a long stat ("Protocol Bot health") or table name never
 * pushes the dice apart. Screen readers read the roll's summary instead.
 */
const captionStyles = css({
  display: "none",
  maxWidth: "calc(var(--die-size) * 3)",
  fontSize: "2xs",
  lineHeight: "tight",
  color: "fg.muted",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "label",
  fontFamily: "heading",
  fontWeight: "bold",
  overflowWrap: "break-word",
  textWrap: "balance",
  // lineClamp sets display, so it lives only under the shown condition,
  // whose higher specificity beats the hidden default.
  "[data-captions] &": { lineClamp: 2 },
  "&[data-tone=danger]": { color: "danger.fg" },
});

const operatorStyles = css({
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  minWidth: "10px",
  color: "fg.subtle",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  "&[data-word]": {
    paddingInline: "1",
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "label",
  },
});

const numberStyles = css({
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  minWidth: "var(--die-size)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  color: "fg.default",
});

/**
 * A die. The shape is drawn in SVG behind the number: a rounded square for
 * the d6, a kite for a d10, a wide plate for a d100. A second, larger shape
 * draws the ring around a match: green on a strong hit with a match, red on
 * a miss with a match, the accent colour on an oracle match.
 */
const dieStyles = css({
  position: "relative",
  display: "inline-grid",
  placeItems: "center",
  flex: "none",
  height: "var(--die-size)",
  minWidth: "var(--die-size)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  verticalAlign: "middle",
  "--die-fill": "{colors.bg.emphasized}",
  "--die-stroke": "{colors.border.control}",
  "--die-fg": "{colors.fg.default}",
  "--die-ring": "{colors.accent.fg}",
  color: "var(--die-fg)",
  "&[data-size=xs]": { "--die-size": "22px", "--die-font": "0.8125rem" },
  "&[data-size=sm]": { "--die-size": "26px", "--die-font": "0.9375rem" },
  "&[data-size=md]": { "--die-size": "32px", "--die-font": "1.0625rem" },
  "& > svg": {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    overflow: "visible",
  },
  "& > svg > [data-face]": {
    fill: "var(--die-fill)",
    stroke: "var(--die-stroke)",
    strokeWidth: 1.5,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
  },
  "& > svg > [data-ring]": {
    fill: "none",
    stroke: "var(--die-ring)",
    strokeWidth: 2,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
  },
  "& > span": { position: "relative" },
  "&[data-shape=d100]": { minWidth: "calc(var(--die-size) * 1.35)" },
  "&[data-kind=action]": {
    "--die-fill": "{colors.bg.chip}",
    "--die-stroke": "{colors.bg.chip}",
    "--die-fg": "{colors.fg.onChip}",
  },
  "&[data-state=beaten]": {
    "--die-fill": "{colors.success.soft}",
    "--die-stroke": "color-mix(in oklab, {colors.success.fg} 55%, transparent)",
    "--die-fg": "{colors.success.fg}",
  },
  "&[data-state=held]": {
    "--die-fill": "{colors.danger.soft}",
    "--die-stroke": "color-mix(in oklab, {colors.danger.fg} 55%, transparent)",
    "--die-fg": "{colors.danger.fg}",
  },
  // A colour of the caller's (Sundered Isles' cinder and wraith): a beaten
  // die is solid in it, a held one only outlined, so the status still reads.
  "&[data-hue][data-state=beaten]": {
    "--die-fill": "var(--die-hue)",
    "--die-stroke": "var(--die-hue)",
    "--die-fg": "{colors.bg.surface}",
  },
  "&[data-hue][data-state=held]": {
    "--die-fill":
      "color-mix(in oklab, var(--die-hue) 10%, {colors.bg.surface})",
    "--die-stroke": "var(--die-hue)",
    "--die-fg": "var(--die-hue)",
  },
  "&[data-state=cursed]": {
    "--die-fill": "{colors.cursed.soft}",
    "--die-stroke": "{colors.cursed.fg}",
    "--die-fg": "{colors.cursed.fg}",
  },
  "&[data-state=quiet]": {
    "--die-fill": "transparent",
    "--die-stroke": "{colors.border.default}",
    "--die-fg": "{colors.fg.muted}",
  },
  // Negative momentum matched the action die, so it counts as zero.
  // Two attributes, so it outranks `data-kind=action` whatever the order.
  "&[data-cancelled][data-kind]": {
    "--die-fill": "{colors.danger.soft}",
    "--die-stroke": "{colors.danger.fg}",
    "--die-fg": "{colors.danger.fg}",
    "& > span": {
      textDecoration: "line-through",
      textDecorationThickness: "2px",
    },
  },
  "&[data-ring=high]": { "--die-ring": "{colors.success.fg}" },
  "&[data-ring=low]": { "--die-ring": "{colors.danger.fg}" },
});

export type DieShape = "d6" | "d10" | "d100";

function DieShapeSvg(props: { shape: DieShape; ring: boolean }) {
  const { shape, ring } = props;
  if (shape === "d10") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden focusable="false">
        {ring && (
          <polygon
            data-ring=""
            points="16,-3 34.5,11 34.5,21 16,35 -2.5,21 -2.5,11"
          />
        )}
        <polygon
          data-face=""
          points="16,1.5 30.5,12.5 30.5,19.5 16,30.5 1.5,19.5 1.5,12.5"
        />
      </svg>
    );
  }
  const width = shape === "d100" ? 43 : 32;
  return (
    <svg
      viewBox={`0 0 ${width} 32`}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      {ring && (
        <rect
          data-ring=""
          x="-2.5"
          y="-2.5"
          width={width + 5}
          height="37"
          rx="10"
        />
      )}
      <rect data-face="" x="1" y="1" width={width - 2} height="30" rx="7" />
    </svg>
  );
}

export interface DieProps extends LayoutProps {
  value: ReactNode;
  shape: DieShape;
  kind?: "action" | "challenge" | "oracle";
  /**
   * `beaten` and `held` colour a challenge die by the score; `cursed` is a
   * 10 on the cursed die; `quiet` is a cursed die short of 10.
   */
  state?: "beaten" | "held" | "cursed" | "quiet";
  /** Draws the match ring: `high` green, `low` red, `match` the accent. */
  ring?: RollCritical | "match";
  /** Strikes the die out: negative momentum cancelled it. */
  cancelled?: boolean;
  /**
   * A colour for the die in place of the status colours, as any CSS colour
   * (`var(--colors-danger-fg)`). Beaten dice fill with it, held ones are
   * outlined in it.
   */
  color?: string;
  /** Overrides the size from the surrounding `DiceDisplay`. */
  size?: "xs" | "sm" | "md";
  className?: string;
}

/** One die, decorative. Something nearby must say what it shows. */
export function Die(props: DieProps) {
  const { value, shape, kind, state, ring, cancelled, color, size, className } =
    withLayoutProps(props);
  return (
    <span
      className={cx(dieStyles, className)}
      data-shape={shape}
      data-kind={kind}
      data-state={state}
      data-ring={ring}
      data-cancelled={cancelled || undefined}
      data-hue={color ? "" : undefined}
      data-size={size}
      style={color ? ({ "--die-hue": color } as CSSProperties) : undefined}
      aria-hidden
    >
      <DieShapeSvg shape={shape} ring={!!ring} />
      <span data-term-value="">{value}</span>
    </span>
  );
}

function Term(props: {
  caption?: string;
  tone?: "danger";
  children: ReactNode;
}) {
  const { caption, tone, children } = props;
  return (
    <span className={termStyles}>
      {children}
      {caption && (
        <span className={captionStyles} data-tone={tone}>
          {caption}
        </span>
      )}
    </span>
  );
}

function Operator(props: { children: ReactNode; word?: boolean }) {
  return (
    <span className={operatorStyles} data-word={props.word || undefined}>
      {props.children}
    </span>
  );
}

function CursedDieValue(props: { value: number }) {
  return props.value === 10 ? (
    <Skull weight="fill" aria-hidden className={css({ display: "block" })} />
  ) : (
    props.value
  );
}

/** Colours for the two challenge dice, in place of the status colours. */
export type ChallengeDieColors = [string | undefined, string | undefined];

export interface DiceDisplayProps extends LayoutProps {
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
 * The dice of a roll. Action rolls show the action die (dark, like the roll
 * buttons) plus stat and adds, then the score against the challenge dice:
 * green where the score beats a die, red where it doesn't. A match rings
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
  } = withLayoutProps(props);
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
    const group = (
      <span className={challengeGroupStyles} data-crit={ring ? "" : undefined}>
        {dice}
      </span>
    );
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
      terms.push(
        <Term key="stat" caption={roll.statName}>
          <span className={numberStyles}>{formatSigned(roll.statValue)}</span>
        </Term>,
      );
    }
    if (roll.adds) {
      terms.push(
        <Term key="adds" caption={s.addsCaption}>
          <span className={numberStyles}>{formatSigned(roll.adds)}</span>
        </Term>,
      );
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

const chipTermStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  height: "var(--die-size)",
  paddingInline: "2",
  borderRadius: "sm",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  "& svg": { width: "1em", height: "1em", flex: "none" },
  "&[data-tone=momentum]": {
    background: "warning.soft",
    color: "warning.fg",
  },
  "&[data-tone=progress]": {
    background: "bg.emphasized",
    color: "fg.default",
  },
});

function MomentumChip(props: { value: number }) {
  return (
    <span className={chipTermStyles} data-tone="momentum">
      <Flame weight="fill" aria-hidden />
      {props.value}
    </span>
  );
}

function ProgressChip(props: { value: number }) {
  return (
    <span className={chipTermStyles} data-tone="progress">
      <ProgressGlyph />
      {props.value}
    </span>
  );
}

/** A filled progress box, for the progress score. */
function ProgressGlyph() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      focusable="false"
      className={css({
        stroke: "currentColor",
        strokeWidth: 2.4,
        strokeLinecap: "round",
        fill: "none",
      })}
    >
      <rect x="1" y="1" width="18" height="18" rx="3" strokeWidth="1.5" />
      <line x1="5" y1="15" x2="15" y2="5" />
      <line x1="5" y1="5" x2="15" y2="15" />
    </svg>
  );
}

const inlineStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  verticalAlign: "middle",
  fontVariantNumeric: "tabular-nums",
});

export interface OracleDiceProps extends LayoutProps {
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
  } = withLayoutProps(props);
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
