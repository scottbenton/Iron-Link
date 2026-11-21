import type { TFunction } from "i18next";

/** The words every meter's steppers and announcements use. */
export interface MeterStrings {
  /** "Subtract 1 from Health" */
  decrement: (label: string) => string;
  /** "Add 1 to Health" */
  increment: (label: string) => string;
  /** Announced after a change: "Health is now +3". */
  changed: (label: string, value: string) => string;
}

export function getMeterStrings(t: TFunction): MeterStrings {
  return {
    decrement: (label) =>
      t("ui.meter.decrement", "Subtract 1 from {{label}}", { label }),
    increment: (label) =>
      t("ui.meter.increment", "Add 1 to {{label}}", { label }),
    changed: (label, value) =>
      t("ui.meter.changed", "{{label}} is now {{value}}", { label, value }),
  };
}
