import { Minus, Plus, Question } from "@phosphor-icons/react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { IconButton } from "../../components/IconButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/Popover";
import { VisuallyHidden } from "../../components/VisuallyHidden";
import { clamp, formatSigned } from "../shared/format";

/**
 * One pill holding the label, a help button and the stepper: a modifier
 * chip rather than a card, so it never reads as a fourth meter. Flat (no
 * ledge): the buttons inside are the pressable parts. Once adds are set it
 * takes the accent's soft tint and an accent border, beside the value's
 * solid pill. No margin of its own, so a caller can inset it.
 */
const chipStyles = css({
  display: "inline-flex",
  alignItems: "center",
  // Its own width, even as a stretching column's child (a Stack, a grid).
  width: "fit-content",
  maxWidth: "100%",
  minWidth: 0,
  gap: "0.5",
  color: "fg.default",
  paddingInlineStart: "3",
  paddingInlineEnd: "0.5",
  paddingBlock: "0.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "full",
  background: "bg.surface",
  transitionProperty: "background-color, border-color",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  "&[data-read-only]": { paddingInlineEnd: "1" },
  "&[data-active]": {
    background: "accent.soft",
    borderColor:
      "color-mix(in oklab, token(colors.accent.solid) 55%, token(colors.border.default))",
  },
  _reducedMotion: { transition: "none" },
});

const labelStyles = css({
  flex: "0 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "sm",
  lineHeight: "none",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  "[data-active] &": { color: "accent.fg" },
});

/**
 * Set adds wear the adds badge's colours (`addsBadgeStyles`), so the value
 * here reads as the same thing as the badge on every stat and meter. At 0 it
 * is a plain grey number.
 */
const valueStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "34px",
  height: "22px",
  paddingInline: "1.5",
  borderRadius: "full",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "md",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  color: "fg.subtle",
  transitionProperty: "background-color, color, box-shadow",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  "&[data-active]": {
    background: "accent.solid",
    color: "accent.onSolid",
    boxShadow: "0 0 0 1px token(colors.accent.edge)",
  },
  "[data-disabled] &": { opacity: 0.6 },
  _reducedMotion: { transition: "none" },
});

/**
 * Round 28px steppers inside the chip (the recipe's own corners and 32px
 * would poke out of the pill). The selectors outrank the Button recipe, so
 * they win whatever order Panda writes them in. They grow to 44px under a
 * coarse pointer, and at any pointer with `stepperSize="touch"`.
 */
const stepperStyles = css({
  "[data-adds-control] &": {
    width: "control.xs",
    minWidth: "control.xs",
    height: "control.xs",
    minHeight: "control.xs",
    borderRadius: "full",
    _touch: {
      width: "touch",
      minWidth: "touch",
      height: "touch",
      minHeight: "touch",
    },
  },
  "[data-adds-control][data-stepper-size=touch] &": {
    width: "touch",
    minWidth: "touch",
    height: "touch",
    minHeight: "touch",
  },
});

/** The help button keeps a little room before the stepper. */
const helpStyles = css({
  "[data-adds-control] &": {
    marginInlineEnd: "1.5",
    color: "fg.muted",
  },
  "[data-adds-control][data-read-only] &": { marginInlineEnd: "0.5" },
});

export interface AddsControlProps extends CssProp {
  /** Adds on the next roll, -9 to +9 in Iron Link. */
  value: number;
  /** Changes the adds. Without it the chip is read-only (no steppers). */
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** 44px steppers at any pointer, for a phone sheet; see `ConditionMeter`. */
  stepperSize?: "sm" | "touch";
  label?: string;
  /**
   * What adds apply to: shown in a popover from the help button beside the
   * label, and the group's description for a screen reader. `null` hides
   * both.
   */
  hint?: string | null;
  /** The help button's name, "About Adds". */
  helpLabel?: (label: string) => string;
  decrementLabel?: (label: string) => string;
  incrementLabel?: (label: string) => string;
  /** What a screen reader hears after a change, "Adds is now +1". */
  changeAnnouncement?: (label: string, value: string) => string;
  className?: string;
}

/**
 * Adds: a bonus or penalty the player sets before a roll, added to the next
 * action roll, whichever stat or meter it uses, and then reset to 0 (the app
 * clears it once a roll uses it). The stat cards and meter rollers show it
 * as a badge in the corner; this is where it is set. A compact chip, the
 * label and a stepper in one pill, meant to sit above the stats as a
 * modifier on everything below it. The group's name includes the value
 * ("Adds +2"), so a screen reader hears it on reaching either stepper. What
 * adds do sits behind a help button (a popover, so it works on touch,
 * which a tooltip does not), and is also the group's description.
 */
export function AddsControl(props: AddsControlProps) {
  const { t } = useTranslation();
  const {
    value,
    onChange,
    min = -9,
    max = 9,
    disabled,
    stepperSize = "sm",
    label = t("ui.adds-control.label", "Adds"),
    hint = t("ui.adds-control.hint", "Added to your next action roll"),
    helpLabel = (l) =>
      t("ui.adds-control.help", "About {{label}}", { label: l }),
    decrementLabel = (l) =>
      t("ui.meter.decrement", "Subtract 1 from {{label}}", { label: l }),
    incrementLabel = (l) =>
      t("ui.meter.increment", "Add 1 to {{label}}", { label: l }),
    changeAnnouncement = (l, v) =>
      t("ui.meter.changed", "{{label}} is now {{value}}", {
        label: l,
        value: v,
      }),
    className,
  } = withCssProp<AddsControlProps>(props);

  const labelId = useId();
  const valueId = useId();
  const hintId = useId();
  const announce = useAnnounce();
  const active = value !== 0 || undefined;

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
      aria-labelledby={`${labelId} ${valueId}`}
      aria-describedby={hint ? hintId : undefined}
      className={cx(chipStyles, className)}
      data-adds-control=""
      data-stepper-size={stepperSize}
      data-disabled={disabled || undefined}
      data-active={active}
      data-read-only={!onChange || undefined}
    >
      <span id={labelId} className={labelStyles}>
        {label}
      </span>
      {hint && (
        <>
          <VisuallyHidden id={hintId}>{hint}</VisuallyHidden>
          <Popover>
            <PopoverTrigger
              render={
                <IconButton
                  label={helpLabel(label)}
                  size="sm"
                  className={cx(stepperStyles, helpStyles)}
                >
                  <Question weight="bold" />
                </IconButton>
              }
            />
            <PopoverContent title={label} description={hint} />
          </Popover>
        </>
      )}
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
      <span id={valueId} className={valueStyles} data-active={active}>
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
    </div>
  );
}
