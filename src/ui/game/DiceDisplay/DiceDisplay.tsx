import { Flame, Skull } from "@phosphor-icons/react";
import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { RollTextOverrides, getRollSummary } from "../RollCard/getRollSummary";
import { RollData, getComparedScore } from "../RollCard/rollTypes";
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

const termStyles = css({
  display: "grid",
  justifyItems: "center",
  gap: "0.5",
  minWidth: "var(--die-size)",
});

const captionStyles = css({
  fontSize: "2xs",
  lineHeight: "snug",
  color: "fg.muted",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
  letterSpacing: "label",
  fontFamily: "heading",
  fontWeight: "semibold",
  "[data-size=sm] &": { display: "none" },
});

const operatorStyles = css({
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  minWidth: "10px",
  color: "fg.subtle",
  fontFamily: "heading",
  fontWeight: "semibold",
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
  fontWeight: "semibold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  color: "fg.default",
});

/**
 * A die. The shape is drawn in SVG behind the number so a match can outline
 * it: a rounded square for the d6, a kite for a d10, a wide plate for d100.
 */
const dieStyles = css({
  position: "relative",
  display: "grid",
  placeItems: "center",
  height: "var(--die-size)",
  minWidth: "var(--die-size)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  "--die-fill": "{colors.bg.emphasized}",
  "--die-stroke": "{colors.border.control}",
  "--die-fg": "{colors.fg.default}",
  color: "var(--die-fg)",
  "& > svg": {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    overflow: "visible",
  },
  "& > svg > *": {
    fill: "var(--die-fill)",
    stroke: "var(--die-stroke)",
    strokeWidth: 1.5,
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
  "&[data-state=cursed]": {
    "--die-fill": "{colors.cursed.soft}",
    "--die-stroke": "{colors.cursed.fg}",
    "--die-fg": "{colors.cursed.fg}",
  },
  "&[data-match] > svg > *": {
    stroke: "accent.fg",
    strokeWidth: 2.5,
  },
});

const iconTermStyles = css({
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

type DieShape = "d6" | "d10" | "d100";

function DieShapeSvg(props: { shape: DieShape }) {
  const { shape } = props;
  if (shape === "d10") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden focusable="false">
        <polygon points="16,1.5 30.5,12.5 30.5,19.5 16,30.5 1.5,19.5 1.5,12.5" />
      </svg>
    );
  }
  return (
    <svg
      viewBox={shape === "d100" ? "0 0 43 32" : "0 0 32 32"}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      <rect x="1" y="1" width={shape === "d100" ? 41 : 30} height="30" rx="7" />
    </svg>
  );
}

interface DieProps {
  value: ReactNode;
  shape: DieShape;
  kind?: "action" | "challenge" | "oracle";
  state?: "beaten" | "held" | "cursed";
  match?: boolean;
}

function Die(props: DieProps) {
  const { value, shape, kind, state, match } = props;
  return (
    <span
      className={dieStyles}
      data-shape={shape}
      data-kind={kind}
      data-state={state}
      data-match={match || undefined}
    >
      <DieShapeSvg shape={shape} />
      <span data-term-value="">{value}</span>
    </span>
  );
}

function Term(props: { caption?: string; children: ReactNode }) {
  const { caption, children } = props;
  return (
    <span className={termStyles}>
      {children}
      {caption && <span className={captionStyles}>{caption}</span>}
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

export interface DiceDisplayProps {
  roll: RollData;
  /** `sm` drops the captions, for compact cards. */
  size?: "sm" | "md";
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

/**
 * The dice of a roll. Action rolls show the action die (dark, like the roll
 * buttons) plus stat and adds, then the score against the challenge dice:
 * green where the score beats a die, red where it doesn't, and outlined in
 * the accent colour on a match. Burned momentum strikes the action score out
 * and takes its place.
 */
export function DiceDisplay(props: DiceDisplayProps) {
  const {
    roll,
    size = "md",
    labelled,
    strings: stringsProp,
    rollText,
    className,
  } = props;
  const s = { ...defaultDiceDisplayStrings, ...stringsProp };

  const a11y = labelled
    ? { role: "img", "aria-label": getRollSummary(roll, { text: rollText }) }
    : { "aria-hidden": true };

  const score = getComparedScore(roll);

  const challenge =
    roll.kind === "oracle" ? null : (
      <Term caption={s.challengeCaption}>
        <span className={css({ display: "flex", gap: "1" })}>
          {roll.challengeDice.map((die, index) => (
            <Die
              key={index}
              shape="d10"
              kind="challenge"
              value={die}
              state={score !== undefined && score > die ? "beaten" : "held"}
              match={roll.challengeDice[0] === roll.challengeDice[1]}
            />
          ))}
        </span>
      </Term>
    );

  let left: ReactNode = null;

  if (roll.kind === "action") {
    const capped = Math.min(roll.actionScore, 10);
    const terms: ReactNode[] = [
      <Term
        key="die"
        caption={
          roll.negativeMomentumCancelled ? s.cancelledCaption : s.actionCaption
        }
      >
        <span
          className={groupStyles}
          data-struck={roll.negativeMomentumCancelled || undefined}
        >
          <Die shape="d6" kind="action" value={roll.actionDie} />
        </span>
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
        {terms.length > 1 && (
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
            <span className={iconTermStyles} data-tone="momentum">
              <Flame weight="fill" aria-hidden />
              {roll.momentumBurned}
            </span>
          </Term>
        ) : null}
      </>
    );
  } else if (roll.kind === "progress") {
    left = (
      <Term caption={s.progressCaption}>
        <span className={iconTermStyles} data-tone="progress">
          <ProgressGlyph />
          {roll.progressScore}
        </span>
      </Term>
    );
  } else {
    const rolls = Array.isArray(roll.roll) ? roll.roll : [roll.roll];
    const captions =
      typeof roll.result === "string"
        ? []
        : roll.result.map((part) => part.label);
    left = (
      <>
        {rolls.map((value, index) => (
          <Term key={index} caption={captions[index] ?? s.oracleCaption}>
            <Die
              shape="d100"
              kind="oracle"
              value={value}
              match={!!roll.match && rolls.length === 1}
            />
          </Term>
        ))}
        {roll.cursedDie ? (
          <Term caption={s.cursedCaption}>
            <Die
              shape="d10"
              value={
                roll.cursedDie === 10 ? (
                  <Skull
                    weight="fill"
                    aria-hidden
                    className={css({ display: "block" })}
                  />
                ) : (
                  roll.cursedDie
                )
              }
              state={roll.cursedDie === 10 ? "cursed" : undefined}
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
