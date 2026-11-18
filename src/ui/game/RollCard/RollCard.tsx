import { Skull, Sparkle, X } from "@phosphor-icons/react";
import { ReactNode, Ref } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import {
  ChallengeDieColors,
  DiceDisplay,
  OracleDice,
} from "../DiceDisplay/DiceDisplay";
import { DiceDisplayStrings } from "../DiceDisplay/diceDisplayStrings";
import {
  RollTextOverrides,
  getRollContext,
  getRollSummary,
  getRollText,
  getRollTitle,
} from "./getRollSummary";
import {
  RollData,
  getRollCritical,
  isChallengeRoll,
  isRollMatch,
} from "./rollTypes";

const cardStyles = css({
  "--outcome": "{colors.fg.default}",
  position: "relative",
  display: "grid",
  gap: "2",
  minWidth: 0,
  width: "100%",
  // A place that shows cards side by side with other things (the game log)
  // sets its own cap through this variable.
  maxWidth: "var(--roll-card-max-width, 440px)",
  paddingBlock: "3",
  paddingInline: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  textAlign: "start",
  "&[data-outcome=strongHit]": { "--outcome": "{colors.success.fg}" },
  "&[data-outcome=weakHit]": { "--outcome": "{colors.warning.fg}" },
  "&[data-outcome=miss]": { "--outcome": "{colors.danger.fg}" },
  "&[data-cursed]": {
    borderColor:
      "color-mix(in oklab, {colors.cursed.fg} 45%, {colors.border.default})",
  },
  // Sized to what it shows, up to the max width, rather than filling the
  // row: the game log, where cards sit on their author's side like messages.
  "&[data-width=content]": { width: "fit-content" },
  "&[data-elevated]": { boxShadow: "popover" },
  "&[data-elevated]:not([data-cursed])": { borderColor: "border.control" },
  "&[data-variant=compact]": {
    gap: "1.5",
    paddingBlock: "2",
    paddingInline: "3",
    borderRadius: "md",
    background: "bg.muted",
  },
  // The Workbench rises 6px as it fades in; that needs a keyframe the theme
  // does not have yet, so it only fades for now.
  "&[data-animate]": {
    animation: "fadeIn var(--durations-normal) var(--easings-out)",
  },
});

const contentStyles = css({
  display: "grid",
  gap: "2",
  minWidth: 0,
  "[data-variant=compact] &": { gap: "1" },
});

/** What was rolled: "Face Danger · Edge". Quieter than the outcome. */
const headStyles = css({
  minWidth: 0,
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "snug",
  color: "fg.default",
  overflowWrap: "anywhere",
  // Room for the dismiss button laid over the top right corner.
  "[data-dismissable] &": { paddingInlineEnd: "8" },
  "[data-variant=compact] &": { fontSize: "sm" },
});

const contextStyles = css({
  color: "fg.muted",
  fontWeight: "medium",
  "&::before": {
    content: '"·"',
    marginInline: "1.5",
    color: "fg.subtle",
  },
});

const outcomeRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "2",
  rowGap: "1",
  minWidth: 0,
});

/** The outcome is the card's loudest element: big, bold, in its colour. */
const outcomeStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xl",
  lineHeight: "none",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "var(--outcome)",
  whiteSpace: "nowrap",
  "[data-variant=compact] &": { fontSize: "lg" },
});

const chipStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "1.5",
  paddingBlock: "0.5",
  borderRadius: "full",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "2xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  background: "bg.emphasized",
  color: "fg.muted",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  "& svg": { width: "1.2em", height: "1.2em" },
  "&[data-tone=match]": { background: "accent.soft", color: "accent.fg" },
  "&[data-tone=high]": { background: "success.soft", color: "success.fg" },
  "&[data-tone=low]": { background: "danger.soft", color: "danger.fg" },
  "&[data-tone=danger]": { background: "danger.soft", color: "danger.fg" },
  "&[data-tone=cursed]": { background: "cursed.soft", color: "cursed.fg" },
});

const resultStyles = css({
  margin: 0,
  minWidth: 0,
  fontSize: "md",
  fontWeight: "semibold",
  lineHeight: "snug",
  color: "fg.default",
  overflowWrap: "anywhere",
  "[data-variant=compact] &": { fontSize: "sm" },
  "[data-cursed-result] &": { color: "cursed.fg" },
  // The inline d100 sits after the text, with the gap of a word or two.
  "& > [aria-hidden]": { marginInlineStart: "2" },
});

const partsStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "baseline",
  columnGap: "3",
  rowGap: "1",
  margin: 0,
  "& dt": {
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "label",
    color: "fg.muted",
  },
  "& dd": { margin: 0 },
});

const cursedStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "1.5",
  margin: 0,
  fontSize: "sm",
  lineHeight: "snug",
  color: "cursed.fg",
  "& svg": {
    flex: "none",
    width: "1.1em",
    height: "1.1em",
    marginTop: "0.15em",
  },
});

/**
 * The summary covers the card in transparent 1px text, so touching anywhere
 * on it reads the whole roll (VoiceOver's touch exploration too) while the
 * dice, icons and numbers stay hidden.
 */
const summaryStyles = css({
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  color: "transparent",
  forcedColorAdjust: "none",
  fontSize: "1px",
  lineHeight: "1",
  userSelect: "none",
});

const dismissStyles = css({
  display: "flex",
  position: "absolute",
  top: "1.5",
  right: "1.5",
  zIndex: 1,
  "[data-variant=compact] &": { top: "1", right: "1" },
});

const actionsStyles = css({
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexWrap: "wrap",
  gap: "1",
  marginInlineStart: "-2",
  "&:empty": { display: "none" },
});

export interface RollCardAction {
  /** A stable key. */
  id: string;
  /** The button's label, such as "Reroll", "Burn Momentum" or "Copy". */
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * How much of the dice a card draws: `dice` draws them bare, `captions`
 * also names each die (and the challenge dice by `challengeDieNames`).
 */
export type RollCardDiceDetail = "dice" | "captions";

export interface RollCardProps extends Omit<LayoutProps, "width"> {
  roll: RollData;
  /**
   * Shows a named Dismiss button. A roll card dismisses only through it,
   * never a tap on the card. Inside a toast pass the toast's `dismiss`.
   */
  onDismiss?: () => void;
  /** The dismiss button's name, "Dismiss Face Danger" by default. */
  dismissLabel?: string;
  dismissButtonRef?: Ref<HTMLElement>;
  /**
   * Buttons under the roll: Reroll, Burn Momentum, Copy. Full cards show
   * them with labels; compact cards show icon buttons when there is an icon.
   */
  actions?: RollCardAction[];
  /**
   * `compact` for the game log: smaller type and dice, and an oracle's roll
   * sits inline after its result.
   */
  variant?: "default" | "compact";
  /** How much of the dice to draw. `dice` by default. */
  diceDetail?: RollCardDiceDetail;
  /**
   * Colours the challenge dice in place of the status colours, such as
   * Sundered Isles' cinder and wraith. See `DiceDisplay`.
   */
  challengeDieColors?: ChallengeDieColors;
  /** Names the challenge dice in captions, such as Cinder and Wraith. */
  challengeDieNames?: [string, string];
  /**
   * `fill` (the default) takes the row's width up to 440px; `content` sizes
   * the card to what it shows, for the game log. Either way the cap can be
   * changed with the `--roll-card-max-width` custom property.
   */
  width?: "fill" | "content";
  /** A floating shadow, for a toast. */
  elevated?: boolean;
  /** Rises in on mount (a roll result appearing on the page). */
  animateIn?: boolean;
  /** Read before the summary, such as who rolled it and when. */
  summaryPrefix?: string;
  /** Translated words for the card and its summary. */
  text?: RollTextOverrides;
  diceStrings?: Partial<DiceDisplayStrings>;
  /**
   * Adds a "One on the action die" chip when the die shows a 1. Off by
   * default: the d6's red ring already marks a 1, and Datasworn doesn't say
   * when one matters, so set this only when the app knows (an asset of the
   * character's that cares about it).
   */
  oneOnActionDieMatters?: boolean;
  /** "One on the action die" */
  oneOnActionDieLabel?: string;
  /** "Matched negative momentum" */
  cancelledLabel?: string;
  className?: string;
}

/**
 * One roll. For action and progress rolls the outcome (Strong Hit, Weak Hit
 * or Miss) is the loudest thing on the card, with a match flagged beside it
 * in green (strong hit with a match) or red (miss with a match). Oracle and
 * clock rolls lead with their result, and Sundered Isles' curse is marked.
 * Screen readers read one summary (`getRollSummary`) laid over the card in
 * place of its parts. Works on the page, in the game log (`compact`) and
 * inside a toast (`elevated`, with the toast's dismiss as `onDismiss`).
 */
export function RollCard(props: RollCardProps) {
  const {
    roll,
    onDismiss,
    dismissLabel,
    dismissButtonRef,
    actions,
    variant = "default",
    diceDetail = "dice",
    challengeDieColors,
    challengeDieNames,
    width = "fill",
    elevated,
    animateIn,
    summaryPrefix,
    text: textProp,
    diceStrings,
    oneOnActionDieMatters,
    oneOnActionDieLabel = "One on the action die",
    cancelledLabel = "Matched negative momentum",
    className,
  } = withLayoutProps(props, ["width"]);

  const text = getRollText(textProp);
  const title = getRollTitle(roll);
  const context = getRollContext(roll);
  const summary = getRollSummary(roll, {
    text: textProp,
    prefix: summaryPrefix,
  });
  const compact = variant === "compact";

  const critical = getRollCritical(roll);
  const chips: ReactNode[] = [];
  if (isRollMatch(roll)) {
    chips.push(
      <span key="match" className={chipStyles} data-tone={critical ?? "match"}>
        <Sparkle weight="fill" />
        {text.match}
      </span>,
    );
  }
  if (roll.kind === "action") {
    if (oneOnActionDieMatters && roll.actionDie === 1 && !roll.momentumBurned) {
      chips.push(
        <span key="one" className={chipStyles}>
          {oneOnActionDieLabel}
        </span>,
      );
    }
    if (roll.negativeMomentumCancelled) {
      chips.push(
        <span key="cancelled" className={chipStyles} data-tone="danger">
          {cancelledLabel}
        </span>,
      );
    }
  }
  if (roll.kind === "oracle" && roll.cursed) {
    chips.push(
      <span key="cursed" className={chipStyles} data-tone="cursed">
        <Skull weight="fill" />
        {text.cursed}
      </span>,
    );
  }

  const dice = (
    <DiceDisplay
      roll={roll}
      size={compact ? "sm" : "md"}
      captions={diceDetail === "captions"}
      challengeDieColors={challengeDieColors}
      challengeDieNames={challengeDieNames}
      strings={diceStrings}
    />
  );

  let body: ReactNode;
  if (isChallengeRoll(roll)) {
    body = (
      <>
        <div className={outcomeRowStyles}>
          <span className={outcomeStyles}>{text.outcomes[roll.outcome]}</span>
          {chips}
        </div>
        {dice}
      </>
    );
  } else {
    const result = roll.result;
    body = (
      <>
        {typeof result === "string" ? (
          <p className={resultStyles}>
            {result}
            {compact && <OracleDice roll={roll} />}
          </p>
        ) : (
          <dl className={partsStyles}>
            {result.map((part, index) => (
              <div key={index} className={css({ display: "contents" })}>
                <dt>{part.label}</dt>
                <dd className={resultStyles}>
                  {part.text}
                  {compact && (
                    <OracleDice
                      roll={roll}
                      part={index}
                      hideCursedDie={index < result.length - 1}
                    />
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {chips.length > 0 && <div className={outcomeRowStyles}>{chips}</div>}
        {roll.kind === "oracle" && roll.cursedResult && (
          <p className={cursedStyles}>
            <Skull weight="fill" />
            <span>{text.cursedDieAdds(roll.cursedResult)}</span>
          </p>
        )}
        {!compact && dice}
      </>
    );
  }

  const cursed = roll.kind === "oracle" && (roll.cursed || !!roll.cursedResult);

  return (
    <div
      className={cx(cardStyles, className)}
      data-outcome={isChallengeRoll(roll) ? roll.outcome : undefined}
      data-variant={variant}
      data-width={width}
      data-elevated={elevated || undefined}
      data-animate={animateIn || undefined}
      data-dismissable={onDismiss ? "" : undefined}
      data-cursed={cursed || undefined}
      data-cursed-result={(roll.kind === "oracle" && roll.cursed) || undefined}
    >
      <div className={contentStyles} aria-hidden>
        <p className={headStyles}>
          <span>{title}</span>
          {context && <span className={contextStyles}>{context}</span>}
        </p>
        {body}
      </div>

      <div className={summaryStyles}>{summary}</div>

      {actions && actions.length > 0 && (
        <div className={actionsStyles}>
          {actions.map((action) =>
            compact && action.icon ? (
              <IconButton
                key={action.id}
                label={action.label}
                size="sm"
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.icon}
              </IconButton>
            ) : (
              <Button
                key={action.id}
                size="sm"
                variant="ghost"
                startIcon={action.icon}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ),
          )}
        </div>
      )}

      {onDismiss && (
        <span className={dismissStyles}>
          <IconButton
            ref={dismissButtonRef}
            label={dismissLabel ?? `Dismiss ${title}`}
            size="sm"
            onClick={onDismiss}
          >
            <X weight="bold" />
          </IconButton>
        </span>
      )}
    </div>
  );
}
