import { Minus, Plus } from "@phosphor-icons/react";
import { useId } from "react";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import { clamp, formatSigned } from "../shared/format";

/**
 * A slim strip in the meters' card look (1px border, surface, `md` radius):
 * the label, the steppers around the value, then the note. It is one row
 * high, so it sits under the meters as its own line without making the
 * cards beside it taller, and the note has room to say when adds clear.
 */
const stripStyles = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  columnGap: "2",
  rowGap: "0.5",
  minWidth: 0,
  paddingBlock: "1",
  paddingInline: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
});

const labelStyles = css({
  flex: "none",
  minWidth: "40px",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

const controlsStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
});

/**
 * Set adds wear the adds pill's colours (`addsBadgeStyles`), so the value
 * here reads as the same thing as the badge on every roll button. At 0 the
 * value is a plain grey number.
 */
const valueStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "40px",
  height: "26px",
  paddingInline: "1.5",
  borderRadius: "full",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  color: "fg.subtle",
  transitionProperty: "background-color, color",
  transitionDuration: "fast",
  "&[data-active]": {
    background: "accent.solid",
    color: "accent.onSolid",
    boxShadow: "0 0 0 1px token(colors.accent.edge)",
  },
});

const noteStyles = css({
  flex: "1 1 9rem",
  minWidth: 0,
  fontSize: "2xs",
  lineHeight: "snug",
  color: "fg.muted",
});

const stepperStyles = css({
  "[data-stepper-size=touch] &": {
    width: "touch",
    minWidth: "touch",
    height: "touch",
    minHeight: "touch",
  },
});

export interface AddsMeterProps {
  /** Adds on the next roll, -9 to +9 in Iron Link. */
  value: number;
  /** Changes the adds. Without it the strip is read-only (no steppers). */
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** 44px steppers at any pointer; see `ConditionMeter`. */
  stepperSize?: "sm" | "touch";
  label?: string;
  /**
   * Says when adds clear, beside the value and as the group's description.
   * `null` hides it.
   */
  note?: string | null;
  decrementLabel?: (label: string) => string;
  incrementLabel?: (label: string) => string;
  /** What a screen reader hears after a change, "Adds is now +1". */
  changeAnnouncement?: (label: string, value: string) => string;
  className?: string;
}

/**
 * Adds: a bonus or penalty the player sets before a roll, added to the next
 * action roll and then reset to 0 (the app clears it once a roll uses it).
 * The roll buttons show it as a badge in the corner; this is where it is set.
 * A slim strip in the meters' look, smaller than a meter, with steppers on
 * either side of the value, which turns into the adds pill once set.
 */
export function AddsMeter(props: AddsMeterProps) {
  const {
    value,
    onChange,
    min = -9,
    max = 9,
    disabled,
    stepperSize = "sm",
    label = "Adds",
    note = "Added to your next roll, then reset to 0",
    decrementLabel = (l) => `Subtract 1 from ${l}`,
    incrementLabel = (l) => `Add 1 to ${l}`,
    changeAnnouncement = (l, v) => `${l} is now ${v}`,
    className,
  } = props;

  const labelId = useId();
  const noteId = useId();
  const announce = useAnnounce();

  const step = (delta: number) => {
    if (!onChange) return;
    const next = clamp(value + delta, min, max);
    if (next === value) return;
    onChange(next);
    announce(changeAnnouncement(label, formatSigned(next)));
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={note ? noteId : undefined}
      className={cx(stripStyles, className)}
      data-stepper-size={stepperSize}
    >
      <span id={labelId} className={labelStyles}>
        {label}
      </span>
      <span className={controlsStyles}>
        {onChange && (
          <IconButton
            label={decrementLabel(label)}
            size="sm"
            className={stepperStyles}
            focusableWhenDisabled
            disabled={disabled || value <= min}
            onClick={() => step(-1)}
          >
            <Minus weight="bold" />
          </IconButton>
        )}
        <span className={valueStyles} data-active={value !== 0 || undefined}>
          {formatSigned(value)}
        </span>
        {onChange && (
          <IconButton
            label={incrementLabel(label)}
            size="sm"
            className={stepperStyles}
            focusableWhenDisabled
            disabled={disabled || value >= max}
            onClick={() => step(1)}
          >
            <Plus weight="bold" />
          </IconButton>
        )}
      </span>
      {note && (
        <span id={noteId} className={noteStyles}>
          {note}
        </span>
      )}
    </div>
  );
}
