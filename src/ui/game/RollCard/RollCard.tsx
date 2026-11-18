import { Sparkle, X } from "@phosphor-icons/react";
import { ReactNode, Ref } from "react";

import { css, cx } from "styled-system/css";

import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { DiceDisplay } from "../DiceDisplay/DiceDisplay";
import { DiceDisplayStrings } from "../DiceDisplay/diceDisplayStrings";
import {
  RollTextOverrides,
  getRollSummary,
  getRollText,
  getRollTitle,
} from "./getRollSummary";
import { RollData, isRollMatch } from "./rollTypes";

const cardStyles = css({
  "--outcome": "{colors.accent.fg}",
  position: "relative",
  display: "grid",
  gap: "2",
  minWidth: 0,
  width: "100%",
  maxWidth: "440px",
  paddingBlock: "3",
  paddingInlineStart: "4",
  paddingInlineEnd: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  boxShadow: "inset 3px 0 0 var(--outcome)",
  textAlign: "start",
  "&[data-outcome=strongHit]": { "--outcome": "{colors.success.fg}" },
  "&[data-outcome=weakHit]": { "--outcome": "{colors.warning.fg}" },
  "&[data-outcome=miss]": { "--outcome": "{colors.danger.fg}" },
  "&[data-elevated]": {
    boxShadow: "inset 3px 0 0 var(--outcome), token(shadows.popover)",
    borderColor: "transparent",
  },
  "&[data-variant=compact]": {
    gap: "1.5",
    paddingBlock: "2",
    paddingInlineStart: "3",
    paddingInlineEnd: "2",
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
  "[data-variant=compact] &": { gap: "1.5" },
});

const headStyles = css({
  display: "grid",
  gap: "0.5",
  minWidth: 0,
  // Room for the dismiss button laid over the top right corner.
  "[data-dismissable] &": { paddingInlineEnd: "8" },
});

const eyebrowStyles = css({
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const titleRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  columnGap: "2",
  rowGap: "1",
});

const titleStyles = css({
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "lg",
  lineHeight: "tight",
  overflowWrap: "anywhere",
  "[data-variant=compact] &": { fontSize: "md" },
});

const outcomeStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "sm",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "var(--outcome)",
  whiteSpace: "nowrap",
});

const chipStyles = css({
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "center",
  gap: "1",
  paddingInline: "1.5",
  paddingBlock: "0.5",
  borderRadius: "full",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "2xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  background: "bg.emphasized",
  color: "fg.muted",
  whiteSpace: "nowrap",
  "& svg": { width: "1.2em", height: "1.2em" },
  "&[data-tone=match]": { background: "accent.soft", color: "accent.fg" },
});

const resultStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xl",
  lineHeight: "tight",
  color: "fg.default",
  overflowWrap: "anywhere",
  "[data-variant=compact] &": { fontSize: "lg" },
});

const partsStyles = css({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "baseline",
  columnGap: "3",
  rowGap: "0.5",
  margin: 0,
  "& dt": {
    fontFamily: "heading",
    fontWeight: "semibold",
    fontSize: "xs",
    textTransform: "uppercase",
    letterSpacing: "label",
    color: "fg.muted",
  },
  "& dd": { margin: 0 },
});

const cursedStyles = css({
  margin: 0,
  fontSize: "sm",
  color: "cursed.fg",
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

export interface RollCardProps {
  roll: RollData;
  /**
   * Shows a named Dismiss button. A roll card dismisses only through it,
   * never a tap on the card. Inside a toast pass the toast's `dismiss`.
   */
  onDismiss?: () => void;
  /** The dismiss button's name, "Dismiss Face Danger" by default. */
  dismissLabel?: string;
  dismissButtonRef?: Ref<HTMLElement>;
  /** Buttons under the roll: Reroll, Burn Momentum, Copy. */
  actions?: RollCardAction[];
  /** `compact` for the game log: smaller type, dice without captions. */
  variant?: "default" | "compact";
  /** A floating shadow and no border, for a toast. */
  elevated?: boolean;
  /** Rises in on mount (a roll result appearing on the page). */
  animateIn?: boolean;
  /** Read before the summary, such as who rolled it and when. */
  summaryPrefix?: string;
  /** Translated words for the card and its summary. */
  text?: RollTextOverrides;
  diceStrings?: Partial<DiceDisplayStrings>;
  /** "One on the action die" */
  oneOnActionDieLabel?: string;
  /** "Matched negative momentum" */
  cancelledLabel?: string;
  className?: string;
}

/**
 * One roll: what was rolled, the outcome (Strong Hit, Weak Hit or Miss in
 * its colour), a match, the dice and an oracle's result. Screen readers read
 * one summary (`getRollSummary`) laid over the card in place of its parts.
 * Works on the page, in the game log (`compact`) and inside a toast
 * (`elevated`, with the toast's dismiss as `onDismiss`).
 */
export function RollCard(props: RollCardProps) {
  const {
    roll,
    onDismiss,
    dismissLabel,
    dismissButtonRef,
    actions,
    variant = "default",
    elevated,
    animateIn,
    summaryPrefix,
    text: textProp,
    diceStrings,
    oneOnActionDieLabel = "One on the action die",
    cancelledLabel = "Matched negative momentum",
    className,
  } = props;

  const text = getRollText(textProp);
  const title = getRollTitle(roll);
  const summary = getRollSummary(roll, {
    text: textProp,
    prefix: summaryPrefix,
  });
  const match = isRollMatch(roll);
  const compact = variant === "compact";

  let eyebrow: string | undefined;
  if (roll.kind === "action")
    eyebrow = roll.moveName ? roll.statName : undefined;
  else if (roll.kind === "progress")
    eyebrow = roll.moveName ? roll.trackName : undefined;
  else eyebrow = roll.category;

  const extras: string[] = [];
  if (roll.kind === "action") {
    if (roll.actionDie === 1 && !roll.momentumBurned) {
      extras.push(oneOnActionDieLabel);
    }
    if (roll.negativeMomentumCancelled) extras.push(cancelledLabel);
  }

  return (
    <div
      className={cx(cardStyles, className)}
      data-outcome={roll.kind === "oracle" ? undefined : roll.outcome}
      data-variant={variant}
      data-elevated={elevated || undefined}
      data-animate={animateIn || undefined}
      data-dismissable={onDismiss ? "" : undefined}
    >
      <div className={contentStyles} aria-hidden>
        <div className={headStyles}>
          {eyebrow && <span className={eyebrowStyles}>{eyebrow}</span>}
          <div className={titleRowStyles}>
            <span className={titleStyles}>{title}</span>
            {roll.kind !== "oracle" && (
              <span className={outcomeStyles}>
                {text.outcomes[roll.outcome]}
              </span>
            )}
            {match && (
              <span className={chipStyles} data-tone="match">
                <Sparkle weight="fill" />
                {text.match}
              </span>
            )}
            {extras.map((extra) => (
              <span key={extra} className={chipStyles}>
                {extra}
              </span>
            ))}
          </div>
        </div>

        {roll.kind === "oracle" &&
          (typeof roll.result === "string" ? (
            <p className={resultStyles}>{roll.result}</p>
          ) : (
            <dl className={partsStyles}>
              {roll.result.map((part, index) => (
                <div key={index} className={css({ display: "contents" })}>
                  <dt>{part.label}</dt>
                  <dd className={resultStyles}>{part.text}</dd>
                </div>
              ))}
            </dl>
          ))}
        {roll.kind === "oracle" && roll.cursedResult && (
          <p className={cursedStyles}>
            {text.cursedDieAdds(roll.cursedResult)}
          </p>
        )}

        <DiceDisplay
          roll={roll}
          size={compact ? "sm" : "md"}
          strings={diceStrings}
        />
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
