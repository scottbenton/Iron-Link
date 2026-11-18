import { Minus, Plus } from "@phosphor-icons/react";
import { useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { getXPPipState, xpPipStyles } from "./xpPipStyles";
import { XPTrackStrings, defaultXPTrackStrings } from "./xpTrackStrings";

const rootStyles = css({
  display: "grid",
  gap: "2",
  minWidth: 0,
});

const headStyles = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
  flexWrap: "wrap",
});

const labelStyles = css({
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

const summaryStyles = css({
  fontSize: "sm",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
  "& strong": { color: "fg.default", fontWeight: "semibold" },
});

const pipsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 4px",
  // A gap after every fifth pip, so counts read at a glance.
  "& > [data-group-end]:not(:last-child)": { marginInlineEnd: "6px" },
});

const steppersStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "4px 16px",
});

const stepperStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  fontSize: "sm",
  color: "fg.muted",
  "& > span": { minWidth: "48px", textAlign: "center" },
});

export interface XPTrackProps {
  /** Experience earned. */
  earned: number;
  /** Experience spent on assets and upgrades. */
  spent?: number;
  /** Pips on the track: 30 for Ironsworn, more for long campaigns. */
  total?: number;
  /** Shows steppers for earned experience. */
  onEarnedChange?: (earned: number) => void;
  /** Shows steppers for spent experience. */
  onSpentChange?: (spent: number) => void;
  disabled?: boolean;
  strings?: Partial<XPTrackStrings>;
  className?: string;
}

/**
 * Experience as a row of pips: spent pips grey, pips to spend in the accent
 * colour, unearned pips empty. Optional steppers mark and spend it.
 */
export function XPTrack(props: XPTrackProps) {
  const {
    earned: rawEarned,
    spent: rawSpent = 0,
    total = 30,
    onEarnedChange,
    onSpentChange,
    disabled,
    strings: stringsProp,
    className,
  } = props;
  const strings = { ...defaultXPTrackStrings, ...stringsProp };
  const labelId = useId();
  const announce = useAnnounce();

  const earned = Math.min(Math.max(rawEarned, 0), total);
  const spent = Math.min(Math.max(rawSpent, 0), earned);
  const available = earned - spent;
  const summary = strings.summary(earned, spent, available);

  const report = (nextEarned: number, nextSpent: number) =>
    announce(
      strings.changed(
        strings.label,
        strings.summary(nextEarned, nextSpent, nextEarned - nextSpent),
      ),
    );

  const setEarned = (next: number) => {
    if (!onEarnedChange) return;
    const clamped = Math.min(Math.max(next, spent), total);
    if (clamped === earned) return;
    onEarnedChange(clamped);
    report(clamped, spent);
  };

  const setSpent = (next: number) => {
    if (!onSpentChange) return;
    const clamped = Math.min(Math.max(next, 0), earned);
    if (clamped === spent) return;
    onSpentChange(clamped);
    report(earned, clamped);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cx(rootStyles, className)}
    >
      <div className={headStyles}>
        <span id={labelId} className={labelStyles}>
          {strings.label}
        </span>
        <span className={summaryStyles}>{summary}</span>
      </div>
      <div className={pipsStyles} aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={xpPipStyles}
            data-state={getXPPipState(index, earned, spent)}
            data-group-end={(index + 1) % 5 === 0 || undefined}
          />
        ))}
      </div>
      {(onEarnedChange || onSpentChange) && (
        <div className={steppersStyles}>
          {onEarnedChange && (
            <span className={stepperStyles}>
              <IconButton
                label={strings.removeEarned}
                size="sm"
                focusableWhenDisabled
                disabled={disabled || earned <= spent}
                onClick={() => setEarned(earned - 1)}
              >
                <Minus weight="bold" />
              </IconButton>
              <span aria-hidden>{strings.earnedLabel}</span>
              <IconButton
                label={strings.addEarned}
                size="sm"
                focusableWhenDisabled
                disabled={disabled || earned >= total}
                onClick={() => setEarned(earned + 1)}
              >
                <Plus weight="bold" />
              </IconButton>
            </span>
          )}
          {onSpentChange && (
            <span className={stepperStyles}>
              <IconButton
                label={strings.removeSpent}
                size="sm"
                focusableWhenDisabled
                disabled={disabled || spent <= 0}
                onClick={() => setSpent(spent - 1)}
              >
                <Minus weight="bold" />
              </IconButton>
              <span aria-hidden>{strings.spentLabel}</span>
              <IconButton
                label={strings.addSpent}
                size="sm"
                focusableWhenDisabled
                disabled={disabled || available <= 0}
                onClick={() => setSpent(spent + 1)}
              >
                <Plus weight="bold" />
              </IconButton>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
