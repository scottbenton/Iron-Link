import { CheckCircle, Minus, Plus } from "@phosphor-icons/react";
import { ElementType, ReactElement, ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { Link } from "../../components/Link";
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
import { TickAnimation } from "./tickAnimation";
import {
  trackCardActionsStyles as actionsStyles,
  trackCardBadgeStyles as badgeStyles,
  trackCardStyles as cardStyles,
  trackCardControlsStyles as controlsStyles,
  trackCardDescriptionStyles as descriptionStyles,
  trackCardDotStyles as dotStyles,
  trackCardEyebrowStyles as eyebrowStyles,
  trackCardHeadStyles as headStyles,
  trackCardTitleStyles as titleStyles,
} from "./trackCardStyles";

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
   * Makes the title a link, such as a connection's to its NPC's entry in
   * Notes. Pass `titleLinkRender` for a router link.
   */
  titleHref?: string;
  /** Renders the title's link as another element: `<RouterLink to={path} />`. */
  titleLinkRender?: ReactElement;
  /**
   * The title's element. A span by default: a track title only looks like a
   * heading (CLAUDE.md).
   */
  titleAs?: ElementType;
  /** No card around it, for use inside another card. */
  plain?: boolean;
  /** How new ticks draw in. See ProgressBoxes. */
  tickAnimation?: TickAnimation;
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
    titleHref,
    titleLinkRender,
    titleAs: Title = "span",
    plain,
    tickAnimation,
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
            {titleHref || titleLinkRender ? (
              <Link
                href={titleHref}
                render={titleLinkRender}
                color="inherit"
                underline="hover"
              >
                {label}
              </Link>
            ) : (
              label
            )}
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
        <ProgressBoxes
          ticks={ticks}
          complete={completed}
          animation={tickAnimation}
        />
      </div>

      {actions && <div className={actionsStyles}>{actions}</div>}
    </div>
  );
}
