import { useTranslation } from "react-i18next";

import { ConditionMeter, ConditionMeterProps } from "./ConditionMeter";

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
 * Experience as a meter. Like `MomentumMeter`, it is a `ConditionMeter`
 * with its own defaults rather than a component of its own: the same card,
 * label, steppers, value box, announcements and touch sizes as Health and
 * Spirit, minus the pips. Ironsworn and Starforged earn and spend
 * experience differently, so the meter only counts what is left to spend.
 */
export function XPMeter(props: XPMeterProps) {
  const { t } = useTranslation();
  const {
    label = t("ui.xp-meter.label", "Experience"),
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
