import { ArrowCounterClockwise, CaretDown, Flame } from "@phosphor-icons/react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuTrigger,
} from "../../components/Menu";
import { formatSigned } from "../shared/format";
import { ConditionMeter, MeterTone } from "./ConditionMeter";

/**
 * The value as a pressable that opens Burn and Reset. Same height as a
 * condition meter's value (40px, 44px on touch like the roll buttons), so a
 * row of meters stays one height.
 */
const triggerStyles = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5",
  minWidth: 0,
  minHeight: "40px",
  paddingInline: "1.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  borderRadius: "md",
  background: "bg.surface",
  color: "fg.default",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "1.5rem",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  cursor: "pointer",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.control)",
  transform: "translateY(0)",
  transitionProperty: "transform, box-shadow, background-color, color",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _touch: { minHeight: "touch" },
  "[data-stepper-size=touch] &": { minHeight: "touch" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
  _hover: { background: "bg.muted" },
  "&:active, &[data-pressed], &[data-popup-open]": {
    background: "bg.emphasized",
  },
  "&:active, &[data-pressed]": {
    transform: "translateY(var(--spacing-sink))",
    boxShadow:
      "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 token(colors.border.control)",
    transitionDuration: "instant",
  },
  "&:is(:disabled, [data-disabled])": {
    cursor: "not-allowed",
    color: "fg.subtle",
    background: "bg.emphasized",
    boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.default)",
  },
  "&[data-tone=danger]": { color: "danger.fg" },
  "&[data-tone=success]": { color: "success.fg" },
  "& svg": {
    flex: "none",
    width: "12px",
    height: "12px",
    color: "fg.muted",
    transitionProperty: "transform",
    transitionDuration: "fast",
  },
  "&[data-popup-open] svg": { transform: "rotate(180deg)" },
});

const groupLabelLineStyles = css({ display: "block" });

const warningLineStyles = css({
  display: "block",
  color: "danger.fg",
  textTransform: "none",
  letterSpacing: "normal",
  fontFamily: "body",
  fontWeight: "normal",
});

export interface MomentumMeterProps extends LayoutProps {
  value: number;
  /** Changes momentum. Without it the meter is read-only. */
  onChange?: (value: number) => void;
  /**
   * Burns momentum. Offered while momentum is positive; the app replaces an
   * action die and resets momentum.
   */
  onBurn?: () => void;
  /** Lowest momentum, -6 by default. */
  min?: number;
  /** Highest momentum, 10 less one per impact or debility. */
  max?: number;
  /** What Reset and Burn set momentum to, 2 less impacts (at least 0). */
  resetValue?: number;
  disabled?: boolean;
  /** 44px steppers at any pointer; see `ConditionMeter`. */
  stepperSize?: "sm" | "touch";
  /** "Momentum", or "Focus" under Elegy. */
  label?: string;
  burnLabel?: string;
  resetLabel?: string;
  /** Under Burn: "Replace an action die with +7, then reset to +2". */
  burnDescription?: (value: string, reset: string) => string;
  /** Under Reset: "Set to +2". */
  resetDescription?: (reset: string) => string;
  /** The value button's name: "Momentum +5, Burn or Reset". */
  menuLabel?: (label: string, value: string) => string;
  /** "Max +10, reset +2", heading the menu. */
  limitsText?: (max: string, reset: string) => string;
  /** Shown while momentum is negative, in the menu and the button's name. */
  negativeText?: (cancels: number) => string;
  changeAnnouncement?: (label: string, value: string) => string;
  className?: string;
}

/**
 * Momentum: a condition meter from -6 to its max, the same size as Health,
 * Spirit and Supply beside it. The value opens a menu with Burn and Reset,
 * headed by the max and reset values; below zero the value turns the danger
 * colour and the menu says which action die it cancels.
 */
export function MomentumMeter(props: MomentumMeterProps) {
  const {
    value,
    onChange,
    onBurn,
    min = -6,
    max = 10,
    resetValue = 2,
    disabled,
    stepperSize,
    label = "Momentum",
    burnLabel = "Burn",
    resetLabel = "Reset",
    burnDescription = (v, r) =>
      `Replace an action die with ${v}, then reset to ${r}`,
    resetDescription = (r) => `Set to ${r}`,
    menuLabel = (l, v) => `${l} ${v}, ${burnLabel} or ${resetLabel}`,
    limitsText = (m, r) => `Max ${m}, reset ${r}`,
    negativeText = (n) => `Cancels an action die of ${n}`,
    changeAnnouncement = (l, v) => `${l} is now ${v}`,
    className,
  } = withLayoutProps<MomentumMeterProps>(props);

  const announce = useAnnounce();

  const valueText = formatSigned(value);
  const resetText = formatSigned(resetValue);
  const negative = value < 0 ? negativeText(Math.abs(value)) : undefined;
  const tone: MeterTone =
    value < 0 ? "danger" : value >= max ? "success" : "default";

  const handleReset = () => {
    if (!onChange || value === resetValue) return;
    onChange(resetValue);
    announce(changeAnnouncement(label, resetText));
  };

  const handleBurn = () => {
    if (!onBurn) return;
    onBurn();
    announce(changeAnnouncement(label, resetText));
  };

  const canBurn = !!onBurn && value > 0 && value > resetValue;
  const hasMenu = !!onBurn || !!onChange;

  const triggerName = [menuLabel(label, valueText), negative]
    .filter(Boolean)
    .join(". ");

  const valueControl = hasMenu ? (
    <Menu>
      <MenuTrigger
        render={<button type="button" />}
        className={triggerStyles}
        data-tone={tone}
        disabled={disabled}
        aria-label={triggerName}
      >
        {valueText}
        <CaretDown weight="bold" aria-hidden />
      </MenuTrigger>
      <MenuContent align="center">
        <MenuGroup
          label={
            <>
              <span className={groupLabelLineStyles}>
                {limitsText(formatSigned(max), resetText)}
              </span>
              {negative && (
                <span className={warningLineStyles}>{negative}</span>
              )}
            </>
          }
        >
          {onBurn && (
            <MenuItem
              icon={<Flame weight="fill" />}
              description={burnDescription(valueText, resetText)}
              disabled={!canBurn}
              onClick={handleBurn}
            >
              {burnLabel}
            </MenuItem>
          )}
          {onChange && (
            <MenuItem
              icon={<ArrowCounterClockwise weight="bold" />}
              description={resetDescription(resetText)}
              disabled={value === resetValue}
              onClick={handleReset}
            >
              {resetLabel}
            </MenuItem>
          )}
        </MenuGroup>
      </MenuContent>
    </Menu>
  ) : undefined;

  return (
    <ConditionMeter
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      disabled={disabled}
      stepperSize={stepperSize}
      tone={tone}
      showPips={false}
      changeAnnouncement={changeAnnouncement}
      valueControl={valueControl}
      className={className}
    />
  );
}
