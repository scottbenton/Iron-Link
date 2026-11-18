import { Button as BaseButton } from "@base-ui/react/button";
import { DiceFive, Minus, Plus } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { AddsAnchor } from "../RollButton/AddsBadge";
import {
  statCardBaseStyles,
  statInnerStyles,
  statRollableStyles,
} from "../StatCard/statCardStyles";
import { clamp, formatSigned } from "../shared/format";

const meterStyles = css({
  display: "inline-grid",
  justifyItems: "stretch",
  gap: "1",
  minWidth: "112px",
  "&[data-wide]": { minWidth: "152px" },
  padding: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
});

const labelStyles = css({
  textAlign: "center",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const rowStyles = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(48px, 1fr) auto",
  alignItems: "center",
  gap: "1",
});

const readOnlyRowStyles = css({ gridTemplateColumns: "minmax(48px, 1fr)" });

const valueStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "1.5rem",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  transitionProperty: "color",
  transitionDuration: "fast",
  "&[data-tone=danger]": { color: "danger.fg" },
  "&[data-tone=warning]": { color: "warning.fg" },
  "&[data-tone=success]": { color: "success.fg" },
});

const rollValueStyles = css({
  "--stat-min-height": "40px",
  "--stat-min-width": "48px",
  "& [data-stat-inner]": {
    flexDirection: "row",
    gap: "1",
    paddingInline: "2",
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "1.375rem",
    lineHeight: "none",
    fontVariantNumeric: "tabular-nums",
  },
  "& svg": { width: "14px", height: "14px", opacity: 0.75, flex: "none" },
  "&[data-tone=danger] [data-stat-inner]": {
    color: "color-mix(in oklab, token(colors.danger.fg) 70%, white)",
  },
});

const pipsStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(var(--pip-count), minmax(0, 1fr))",
  gap: "2px",
  height: "4px",
  marginInline: "1",
});

const pipStyles = css({
  borderRadius: "full",
  background: "bg.strip",
  transitionProperty: "background-color",
  transitionDuration: "fast",
  "&[data-filled]": { background: "accent.solid" },
  "[data-tone=danger] &": {
    "&[data-filled]": { background: "danger.solid" },
  },
});

export type MeterTone = "default" | "danger" | "warning" | "success";

export interface ConditionMeterProps {
  /** Health, Spirit, Supply, Integrity, an asset's own meter. */
  label: string;
  value: number;
  min?: number;
  max: number;
  /** Changes the value. Without it the meter is read-only (no steppers). */
  onChange?: (value: number) => void;
  /**
   * Rolls the meter (roll +health). The value becomes the roll button, like
   * a stat card.
   */
  onRoll?: () => void;
  /**
   * Adds on the next roll, shown as a badge on the roll button's top-right
   * corner, as on stat cards and roll buttons. Only shown with `onRoll`.
   */
  adds?: number;
  /** Read after the value when adds apply, "adds +1" by default. */
  addsLabel?: (adds: string) => string;
  /** Steppers and roll stay visible but blocked. */
  disabled?: boolean;
  /** How the value is written, signed by default ("+3"). */
  formatValue?: (value: number) => string;
  /**
   * Colours the value. By default it turns danger at the minimum when
   * `warnAtMin` is set (Health 0), otherwise stays default.
   */
  tone?: MeterTone;
  /** Shows the value in danger colours at the minimum. */
  warnAtMin?: boolean;
  /**
   * A strip of pips from min to max under the value, for meters of ten steps
   * or fewer that start at zero. Off by default: the value and steppers say
   * it all, and the strip makes the card taller.
   */
  showPips?: boolean;
  /** A wider meter, for one with buttons under it. */
  wide?: boolean;
  /** Content under the meter: buttons, a caption. */
  children?: ReactNode;
  /**
   * Your own control in the value's place, such as Momentum's Burn and Reset
   * menu. Replaces the value and the roll button; the steppers stay.
   */
  valueControl?: ReactNode;
  /** Verb for the roll button's name, "Roll" ("Roll Health, +3"). */
  rollLabel?: string;
  decrementLabel?: (label: string) => string;
  incrementLabel?: (label: string) => string;
  /** What a screen reader hears after a change, "Health is now +4". */
  changeAnnouncement?: (label: string, value: string) => string;
  className?: string;
}

/**
 * A condition meter: Health, Spirit, Supply, or an asset meter. Steppers on
 * either side change it by one and announce the new value; the value itself
 * can be a roll button.
 */
export function ConditionMeter(props: ConditionMeterProps) {
  const {
    label,
    value,
    min = 0,
    max,
    onChange,
    onRoll,
    adds = 0,
    addsLabel = (a) => `adds ${a}`,
    disabled,
    formatValue = formatSigned,
    tone: toneProp,
    warnAtMin,
    showPips: showPipsProp,
    wide,
    children,
    valueControl,
    rollLabel = "Roll",
    decrementLabel = (l) => `Subtract 1 from ${l}`,
    incrementLabel = (l) => `Add 1 to ${l}`,
    changeAnnouncement = (l, v) => `${l} is now ${v}`,
    className,
  } = props;

  const labelId = useId();
  const announce = useAnnounce();

  const valueText = formatValue(value);
  const tone: MeterTone =
    toneProp ?? (warnAtMin && value <= min ? "danger" : "default");
  const showPips =
    !!showPipsProp && min >= 0 && max - min <= 10 && max - min > 0;

  const step = (delta: number) => {
    if (!onChange) return;
    const next = clamp(value + delta, min, max);
    if (next === value) return;
    onChange(next);
    announce(changeAnnouncement(label, formatValue(next)));
  };

  const valueNode = valueControl ? (
    valueControl
  ) : onRoll ? (
    <AddsAnchor adds={adds}>
      <BaseButton
        className={cx(statCardBaseStyles, statRollableStyles, rollValueStyles)}
        data-tone={tone}
        disabled={disabled}
        aria-label={
          adds
            ? `${rollLabel} ${label}, ${valueText}, ${addsLabel(formatSigned(adds))}`
            : `${rollLabel} ${label}, ${valueText}`
        }
        onClick={() => onRoll()}
      >
        <span data-stat-inner="" className={statInnerStyles}>
          <DiceFive weight="fill" aria-hidden />
          {valueText}
        </span>
      </BaseButton>
    </AddsAnchor>
  ) : (
    <span className={valueStyles} data-tone={tone}>
      {valueText}
    </span>
  );

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cx(meterStyles, className)}
      data-tone={tone}
      data-wide={wide || undefined}
    >
      <span id={labelId} className={labelStyles}>
        {label}
      </span>
      <div className={cx(rowStyles, !onChange && readOnlyRowStyles)}>
        {onChange && (
          <IconButton
            label={decrementLabel(label)}
            size="sm"
            focusableWhenDisabled
            disabled={disabled || value <= min}
            onClick={() => step(-1)}
          >
            <Minus weight="bold" />
          </IconButton>
        )}
        {valueNode}
        {onChange && (
          <IconButton
            label={incrementLabel(label)}
            size="sm"
            focusableWhenDisabled
            disabled={disabled || value >= max}
            onClick={() => step(1)}
          >
            <Plus weight="bold" />
          </IconButton>
        )}
      </div>
      {showPips && (
        <div
          className={pipsStyles}
          style={{ "--pip-count": max - min } as CSSProperties}
          aria-hidden
        >
          {Array.from({ length: max - min }, (_, index) => (
            <span
              key={index}
              className={pipStyles}
              data-filled={index < value - min ? "" : undefined}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
