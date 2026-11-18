import { CheckCircle, Eraser, Plus } from "@phosphor-icons/react";
import { ElementType, ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { Button } from "../../components/Button";
import { getXPPipState, xpPipStyles } from "../XPTrack/xpPipStyles";
import { ProgressBoxes } from "./ProgressBoxes";
import {
  MAX_TICKS,
  ProgressRank,
  TICKS_PER_BOX,
  clampTicks,
  defaultRankLabels,
  getProgressScore,
  getProgressValueText,
  ticksPerMark,
} from "./progress";
import {
  ProgressTrackStrings,
  defaultProgressTrackStrings,
} from "./progressTrackStrings";

const cardStyles = css({
  display: "grid",
  gap: "3",
  padding: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  boxShadow: "ledge",
  "&[data-plain]": {
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none",
  },
});

const headStyles = css({
  display: "flex",
  alignItems: "start",
  gap: "3",
});

const eyebrowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1.5",
  margin: 0,
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

const dotStyles = css({ color: "fg.subtle" });

const titleStyles = css({
  display: "block",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xl",
  lineHeight: "tight",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

const descriptionStyles = css({
  margin: 0,
  marginTop: "1",
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.muted",
  whiteSpace: "pre-wrap",
});

const badgeStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "2",
  paddingBlock: "0.5",
  borderRadius: "full",
  background: "success.soft",
  color: "success.fg",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  "& svg": { width: "1.1em", height: "1.1em" },
});

const footStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  flexWrap: "wrap",
});

const scoreStyles = css({
  display: "flex",
  alignItems: "baseline",
  gap: "2",
  fontVariantNumeric: "tabular-nums",
});

const scoreNumberStyles = css({
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xl",
  lineHeight: "none",
});

const scoreTextStyles = css({
  fontSize: "sm",
  color: "fg.muted",
});

const buttonsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
});

const xpStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: "3px",
  maxWidth: "var(--progress-boxes-max-width, 420px)",
  marginTop: "-1",
});

const xpBoxStyles = css({
  display: "flex",
  justifyContent: "center",
  gap: "3px",
});

const xpTextStyles = css({
  fontSize: "xs",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
});

export interface ProgressTrackProps {
  /** The vow, journey, fight or connection, such as "Recover the Hollow Crown". */
  label: string;
  /** Ticks, 0 to 40. */
  ticks: number;
  /** Changes the ticks. Without it the track is read-only. */
  onChange?: (ticks: number) => void;
  /** The rank, which sets how much a mark adds. */
  rank?: ProgressRank;
  /** The track's kind, shown before the rank: "Vow", "Journey", "Combat". */
  typeLabel?: string;
  description?: string;
  /** Ticks per mark. Defaults to the rank's (Dangerous marks 8), else 1. */
  step?: number;
  /** A completed track: a badge, success marks and no mark buttons. */
  completed?: boolean;
  /**
   * A legacy track (Quests, Bonds, Discoveries): no rank, and XP pips under
   * the boxes, two per filled box.
   */
  legacy?: boolean;
  /** Legacy XP already spent from this track. */
  xpSpent?: number;
  /** XP per filled legacy box, 2 by default (1 once a track is cleared). */
  xpPerBox?: number;
  /** Extra actions in the foot, such as a Fulfill Your Vow roll button. */
  actions?: ReactNode;
  /** A control at the top right, such as the track's menu. */
  headerAction?: ReactNode;
  /**
   * The title's element. A span by default: a track title only looks like a
   * heading (CLAUDE.md).
   */
  titleAs?: ElementType;
  /** No card around it, for use inside another card. */
  plain?: boolean;
  strings?: Partial<ProgressTrackStrings>;
  rankLabels?: Partial<Record<ProgressRank, string>>;
  className?: string;
}

/**
 * A progress track: ten boxes of four ticks, with its rank, Mark Progress and
 * Erase, and the progress score a progress roll would use.
 */
export function ProgressTrack(props: ProgressTrackProps) {
  const {
    label,
    ticks: rawTicks,
    onChange,
    rank,
    typeLabel,
    description,
    step: stepProp,
    completed,
    legacy,
    xpSpent = 0,
    xpPerBox = 2,
    actions,
    headerAction,
    titleAs: Title = "span",
    plain,
    strings: stringsProp,
    rankLabels: rankLabelsProp,
    className,
  } = props;

  const strings = { ...defaultProgressTrackStrings, ...stringsProp };
  const rankLabels = { ...defaultRankLabels, ...rankLabelsProp };
  const titleId = useId();
  const announce = useAnnounce();

  const ticks = clampTicks(rawTicks);
  const step = stepProp ?? (rank && !legacy ? ticksPerMark[rank] : 1);
  const score = getProgressScore(ticks);
  const valueText = getProgressValueText(ticks, strings);
  const editable = !!onChange && !completed;

  const change = (delta: number) => {
    if (!onChange) return;
    const next = clampTicks(ticks + delta);
    if (next === ticks) return;
    onChange(next);
    announce(strings.updated(label, getProgressValueText(next, strings)));
  };

  const eyebrow: ReactNode[] = [];
  if (legacy) eyebrow.push(typeLabel ?? strings.legacyLabel);
  else if (typeLabel) eyebrow.push(typeLabel);
  if (rank && !legacy) eyebrow.push(rankLabels[rank]);
  if (editable && !legacy && rank) eyebrow.push(strings.markDescription(step));

  const xpEarned = legacy ? score * xpPerBox : 0;
  const spent = Math.min(Math.max(xpSpent, 0), xpEarned);

  return (
    <div
      className={cx(cardStyles, className)}
      data-plain={plain || undefined}
      data-complete={completed || undefined}
    >
      <div className={headStyles}>
        <div className={css({ flex: "1", minWidth: 0 })}>
          {(eyebrow.length > 0 || completed) && (
            <p className={eyebrowStyles}>
              {eyebrow.map((part, index) => (
                <span key={index} className={css({ display: "contents" })}>
                  {index > 0 && (
                    <span className={dotStyles} aria-hidden>
                      ·
                    </span>
                  )}
                  <span>{part}</span>
                </span>
              ))}
              {completed && (
                <span className={badgeStyles}>
                  <CheckCircle weight="fill" aria-hidden />
                  {strings.completedLabel}
                </span>
              )}
            </p>
          )}
          <Title id={titleId} className={titleStyles}>
            {label}
          </Title>
          {description && <p className={descriptionStyles}>{description}</p>}
        </div>
        {headerAction}
      </div>

      <div
        role="progressbar"
        aria-labelledby={titleId}
        aria-valuemin={0}
        aria-valuemax={MAX_TICKS}
        aria-valuenow={ticks}
        aria-valuetext={valueText}
        className={css({ display: "grid", gap: "1.5" })}
      >
        <ProgressBoxes ticks={ticks} complete={completed} />
        {legacy && (
          <div className={xpStyles} aria-hidden>
            {Array.from({ length: 10 }, (_, box) => (
              <span key={box} className={xpBoxStyles}>
                {Array.from({ length: xpPerBox }, (_, pip) => {
                  const index = box * xpPerBox + pip;
                  const state = getXPPipState(index, xpEarned, spent);
                  return (
                    <span
                      key={pip}
                      className={xpPipStyles}
                      data-state={state}
                    />
                  );
                })}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={footStyles}>
        <div className={css({ display: "grid", gap: "0.5" })}>
          <span className={scoreStyles}>
            <span className={scoreTextStyles}>{strings.scoreLabel}</span>
            <span className={scoreNumberStyles}>{score}</span>
            <span className={scoreTextStyles} aria-hidden>
              {ticks % TICKS_PER_BOX !== 0 &&
                `+${ticks % TICKS_PER_BOX}/${TICKS_PER_BOX}`}
            </span>
          </span>
          {legacy && (
            <span className={xpTextStyles}>{strings.xp(xpEarned, spent)}</span>
          )}
        </div>
        {(editable || actions) && (
          <div className={buttonsStyles}>
            {actions}
            {editable && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  startIcon={<Eraser />}
                  disabled={ticks === 0}
                  focusableWhenDisabled
                  aria-label={`${strings.eraseLabel}, ${label}`}
                  onClick={() => change(-step)}
                >
                  {strings.eraseLabel}
                </Button>
                <Button
                  size="sm"
                  startIcon={<Plus weight="bold" />}
                  disabled={ticks >= MAX_TICKS}
                  focusableWhenDisabled
                  aria-label={`${strings.markLabel}, ${label}`}
                  onClick={() => change(step)}
                >
                  {strings.markLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
