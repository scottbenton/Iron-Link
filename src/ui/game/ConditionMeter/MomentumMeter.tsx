import { ArrowCounterClockwise, Flame } from "@phosphor-icons/react";

import { css } from "styled-system/css";

import { useAnnounce } from "../../components/Announcer";
import { Button } from "../../components/Button";
import { formatSigned } from "../shared/format";
import { ConditionMeter } from "./ConditionMeter";

const footStyles = css({
  display: "grid",
  gap: "1.5",
  marginTop: "1",
});

const captionStyles = css({
  textAlign: "center",
  fontSize: "xs",
  lineHeight: "snug",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
});

const warningStyles = css({
  textAlign: "center",
  fontSize: "xs",
  lineHeight: "snug",
  color: "danger.fg",
  textWrap: "balance",
});

const actionsStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
  gap: "1",
});

export interface MomentumMeterProps {
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
  /** "Momentum", or "Focus" under Elegy. */
  label?: string;
  burnLabel?: string;
  resetLabel?: string;
  /** "Max +10, reset +2" under the meter. */
  limitsText?: (max: string, reset: string) => string;
  /** Shown while momentum is negative. */
  negativeText?: (cancels: number) => string;
  changeAnnouncement?: (label: string, value: string) => string;
  className?: string;
}

/**
 * Momentum: a condition meter from -6 to its max, with Burn and Reset. Below
 * zero it says which action die it cancels.
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
    label = "Momentum",
    burnLabel = "Burn",
    resetLabel = "Reset",
    limitsText = (m, r) => `Max ${m}, reset ${r}`,
    negativeText = (n) => `Cancels an action die of ${n}`,
    changeAnnouncement = (l, v) => `${l} is now ${v}`,
    className,
  } = props;

  const announce = useAnnounce();

  const handleReset = () => {
    if (!onChange || value === resetValue) return;
    onChange(resetValue);
    announce(changeAnnouncement(label, formatSigned(resetValue)));
  };

  const canBurn = !!onBurn && value > 0 && value > resetValue;

  return (
    <ConditionMeter
      label={label}
      value={value}
      min={min}
      max={max}
      onChange={onChange}
      disabled={disabled}
      tone={value < 0 ? "danger" : value >= max ? "success" : "default"}
      showPips={false}
      changeAnnouncement={changeAnnouncement}
      wide
      className={className}
    >
      <div className={footStyles}>
        <span className={captionStyles}>
          {limitsText(formatSigned(max), formatSigned(resetValue))}
        </span>
        {value < 0 && (
          <span className={warningStyles}>{negativeText(Math.abs(value))}</span>
        )}
        {(onBurn || onChange) && (
          <div className={actionsStyles}>
            {onBurn && (
              <Button
                size="sm"
                startIcon={<Flame weight="fill" />}
                disabled={disabled || !canBurn}
                focusableWhenDisabled
                onClick={() => onBurn()}
              >
                {burnLabel}
              </Button>
            )}
            {onChange && (
              <Button
                size="sm"
                variant="ghost"
                startIcon={<ArrowCounterClockwise weight="bold" />}
                disabled={disabled || value === resetValue}
                focusableWhenDisabled
                onClick={handleReset}
              >
                {resetLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </ConditionMeter>
  );
}
