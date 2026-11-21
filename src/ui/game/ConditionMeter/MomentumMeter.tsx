import { ArrowCounterClockwise, CaretDown, Flame } from "@phosphor-icons/react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { Button } from "../../components/Button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuTrigger,
} from "../../components/Menu";
import { formatSigned } from "../shared/format";
import {
  ConditionMeter,
  MeterTone,
  meterValueTextStyles,
} from "./ConditionMeter";
import { MeterNumber } from "./MeterNumber";

/**
 * The value opens Burn and Reset, so it is an outline Button (its border,
 * ledge, hover, press, open and disabled states) holding the meter's own
 * number (`meterValueTextStyles`). Sized like the other meters' roll
 * buttons: as tall (40px, 44px on touch), at least 48px wide, 4px sides and
 * a 4px gap before a 14px icon, so a row of meters stays one height and
 * reads as one set. Keyed on `data-momentum-value` too, so it
 * outranks the Button recipe whatever the stylesheet order.
 */
const triggerStyles = css({
  "&[data-momentum-value]": {
    gap: "1",
    minWidth: "48px",
    minHeight: "control.md",
    paddingInline: "1",
    _touch: { minHeight: "touch" },
    "[data-stepper-size=touch] &": { minHeight: "touch" },
    "& svg": {
      width: "icon.sm",
      height: "icon.sm",
      flex: "none",
      color: "fg.muted",
      transitionProperty: "transform",
      transitionDuration: "fast",
    },
    "&[data-popup-open] svg": { transform: "rotate(180deg)" },
  },
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

export interface MomentumMeterProps extends CssProp {
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
  } = withCssProp<MomentumMeterProps>(props);

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
        render={<Button variant="outline" />}
        className={triggerStyles}
        data-momentum-value=""
        disabled={disabled}
        aria-label={triggerName}
      >
        <MeterNumber
          className={meterValueTextStyles}
          tone={tone}
          text={valueText}
          sizes={[formatSigned(min), formatSigned(Math.max(max, 10))]}
        />
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
