import { ConditionMeter, ConditionMeterProps } from "../ConditionMeter";

export interface XPMeterProps
  extends Omit<
    ConditionMeterProps,
    "label" | "min" | "max" | "showPips" | "valueControl" | "children"
  > {
  /** Unspent experience. */
  value: number;
  /** "Experience", or "Unspent Experience" where earned is kept apart. */
  label?: string;
  /** The highest the meter goes, 100 by default (as in the app today). */
  max?: number;
}

const plain = (value: number) => String(value);

/**
 * Experience as a meter, the same card as Health and Spirit: steppers either
 * side of the unspent total. Ironsworn and Starforged earn and spend
 * experience differently, so the meter only counts what is left to spend.
 */
export function XPMeter(props: XPMeterProps) {
  const {
    label = "Experience",
    max = 100,
    formatValue = plain,
    ...rest
  } = props;
  return (
    <ConditionMeter
      label={label}
      min={0}
      max={max}
      formatValue={formatValue}
      showPips={false}
      {...rest}
    />
  );
}

/** The old name: experience is a meter now, not a row of pips. */
export const XPTrack = XPMeter;
export type XPTrackProps = XPMeterProps;
