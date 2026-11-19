import { Button as BaseButton } from "@base-ui/react/button";
import { Minus, Plus } from "@phosphor-icons/react";
import { CSSProperties, ReactNode, useId } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { DieFace, DieRollResult, useDieFace } from "../DieFace";
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
  // 44px steppers at any pointer (a phone sheet's plain +/-), not only
  // under _touch. The value grows to match.
  "&[data-stepper-size=touch] [data-meter-stepper]": {
    width: "touch",
    minWidth: "touch",
    height: "touch",
    minHeight: "touch",
  },
  "&[data-stepper-size=touch] [data-meter-value]": { minHeight: "touch" },
  padding: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
  // Without steppers the meter is only its number (or its roll): as narrow
  // as a stat card, so a viewer's row of meters is no wider than the stats.
  "&[data-read-only]": { minWidth: "72px" },
  "&[data-read-only] [data-meter-value]": {
    minHeight: "control.sm",
  },
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
  "&[data-read-only]": { gridTemplateColumns: "minmax(48px, 1fr)" },
});

/**
 * A meter's number: the type and tone colours, shared by the plain value
 * here and Momentum's menu button.
 */
export const meterValueTextStyles = css({
  fontFamily: "heading",
  fontWeight: "bold",
  // The roll buttons' size (rollValueStyles), so every meter's number matches.
  fontSize: "1.375rem",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  transitionProperty: "color",
  transitionDuration: "fast",
  "&[data-tone=danger]": { color: "danger.fg" },
  "&[data-tone=warning]": { color: "warning.fg" },
  "&[data-tone=success]": { color: "success.fg" },
});

const meterNumberStyles = css({
  display: "inline-grid",
  justifyItems: "center",
  "& > *": { gridArea: "1 / 1" },
  "& > [data-meter-number-sizer]": { visibility: "hidden" },
});

/**
 * A meter's number at a fixed width: as wide as the widest value the meter
 * can hold (its min and max, formatted), so the box around it neither grows
 * at +10 nor shrinks at 0. The sizers are hidden copies in the same grid
 * cell, so the width follows the font rather than a guessed number.
 */
export function MeterNumber(props: {
  text: string;
  sizes: string[];
  className?: string;
  tone?: MeterTone;
}) {
  const { text, sizes, className, tone } = props;
  return (
    <span className={cx(meterNumberStyles, className)} data-tone={tone}>
      {sizes.map((size, index) => (
        <span key={index} data-meter-number-sizer="" aria-hidden>
          {size}
        </span>
      ))}
      <span>{text}</span>
    </span>
  );
}

/** The box a plain value sits in: as tall as the steppers' row. */
const valueBoxStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "control.md",
});

const rollValueStyles = css({
  "--stat-min-height": "{sizes.control.md}",
  "--stat-min-width": "48px",
  "[data-stepper-size=touch] &": { "--stat-min-height": "{sizes.touch}" },
  "& [data-stat-inner]": {
    flexDirection: "row",
    gap: "1",
    // Tight sides, so the roller fits between the steppers in a narrow card.
    paddingInline: "1",
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "1.375rem",
    lineHeight: "none",
    fontVariantNumeric: "tabular-nums",
  },
  "& svg": { width: "icon.sm", height: "icon.sm", opacity: 0.75, flex: "none" },
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

export interface ConditionMeterProps extends LayoutProps {
  /** Health, Spirit, Supply, Integrity, an asset's own meter. */
  label: string;
  value: number;
  min?: number;
  max: number;
  /** Changes the value. Without it the meter is read-only (no steppers). */
  onChange?: (value: number) => void;
  /**
   * Rolls the meter (roll +health). The value becomes the roll button, like
   * a stat card. Return the action die (1 to 6), or a promise of it, and
   * its die lands on it.
   */
  onRoll?: () => DieRollResult;
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
  /**
   * `touch` makes the steppers 44px at any pointer, for a phone layout that
   * wants them regardless of the device it is previewed on. By default they
   * are 32px and grow to 40px under a coarse pointer.
   */
  stepperSize?: "sm" | "touch";
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
    stepperSize = "sm",
    children,
    valueControl,
    rollLabel = "Roll",
    decrementLabel = (l) => `Subtract 1 from ${l}`,
    incrementLabel = (l) => `Add 1 to ${l}`,
    changeAnnouncement = (l, v) => `${l} is now ${v}`,
    className,
  } = withLayoutProps<ConditionMeterProps>(props);

  const labelId = useId();
  const [die, rollDie] = useDieFace();
  const announce = useAnnounce();

  const valueText = formatValue(value);
  const numberSizes = [formatValue(min), formatValue(max)];
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
        onClick={() => {
          rollDie(onRoll());
        }}
      >
        <span data-stat-inner="" className={statInnerStyles}>
          <DieFace {...die} size="inherit" weight="fill" />
          <MeterNumber text={valueText} sizes={numberSizes} />
        </span>
      </BaseButton>
    </AddsAnchor>
  ) : (
    <span
      className={cx(valueBoxStyles, meterValueTextStyles)}
      data-tone={tone}
      data-meter-value=""
    >
      <MeterNumber text={valueText} sizes={numberSizes} />
    </span>
  );

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cx(meterStyles, className)}
      data-tone={tone}
      data-stepper-size={stepperSize}
      data-read-only={!onChange || undefined}
    >
      <span id={labelId} className={labelStyles}>
        {label}
      </span>
      <div
        className={rowStyles}
        data-meter-row=""
        data-read-only={!onChange || undefined}
      >
        {onChange && (
          <IconButton
            label={decrementLabel(label)}
            size="sm"
            data-meter-stepper=""
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
            data-meter-stepper=""
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
