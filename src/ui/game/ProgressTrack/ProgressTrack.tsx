import { CheckCircle, Minus, Plus } from "@phosphor-icons/react";
import { ElementType, ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { ProgressBoxes } from "./ProgressBoxes";
import {
  MAX_TICKS,
  ProgressRank,
  clampTicks,
  defaultRankLabels,
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
  minWidth: 0,
  padding: "3",
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
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "2",
});

const eyebrowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "1.5",
  rowGap: "0.5",
  margin: 0,
  marginBottom: "0.5",
  fontFamily: "heading",
  fontWeight: "bold",
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
  fontWeight: "bold",
  fontSize: "lg",
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
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  "& svg": { width: "1.1em", height: "1.1em" },
});

const controlsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  // Line the buttons up with the title when there is no eyebrow above it.
  marginTop: "-1",
  marginInlineEnd: "-1",
});

const actionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
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
   * A legacy track (Quests, Bonds, Discoveries): no rank. Experience is kept
   * in its own meter (see XPMeter), not on the track.
   */
  legacy?: boolean;
  /** Extra actions under the boxes, such as a Fulfill Your Vow roll button. */
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
 * A progress track: ten boxes of four ticks under its name and rank, with
 * minus and plus buttons that erase and mark progress by the rank's step.
 * Compact enough for a 280px sidebar.
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
        {(editable || headerAction) && (
          <div className={controlsStyles}>
            {editable && (
              <>
                <IconButton
                  label={strings.eraseLabel(label)}
                  size="sm"
                  focusableWhenDisabled
                  disabled={ticks === 0}
                  onClick={() => change(-step)}
                >
                  <Minus weight="bold" />
                </IconButton>
                <IconButton
                  label={strings.markLabel(label)}
                  size="sm"
                  focusableWhenDisabled
                  disabled={ticks >= MAX_TICKS}
                  onClick={() => change(step)}
                >
                  <Plus weight="bold" />
                </IconButton>
              </>
            )}
            {headerAction}
          </div>
        )}
      </div>

      <div
        role="progressbar"
        aria-labelledby={titleId}
        aria-valuemin={0}
        aria-valuemax={MAX_TICKS}
        aria-valuenow={ticks}
        aria-valuetext={valueText}
      >
        <ProgressBoxes ticks={ticks} complete={completed} />
      </div>

      {actions && <div className={actionsStyles}>{actions}</div>}
    </div>
  );
}
