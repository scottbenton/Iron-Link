import type { TFunction } from "i18next";

export interface ClockStrings {
  /** "3 of 6 segments filled" */
  valueText: (value: number, segments: number) => string;
  /** Announced after a change by pointer: "Siege, 3 of 6 segments filled". */
  changed: (label: string, valueText: string) => string;
  /** The centre button's name: "Advance The Iron Siege falls". */
  advanceLabel: (label: string) => string;
  /** The card's minus button: "Remove a segment from The Iron Siege falls". */
  removeLabel: (label: string) => string;
  /** The centre's hint once the clock is full. */
  fullHint: string;
  /** The card's badge on a completed clock. */
  completedLabel: string;
}

export function getDefaultClockStrings(t: TFunction): ClockStrings {
  return {
    valueText: (value, segments) =>
      t("ui.clock.value-text", "{{value}} of {{segments}} segments filled", {
        value,
        segments,
      }),
    changed: (label, text) =>
      t("ui.clock.changed", "{{label}}, {{text}}", { label, text }),
    advanceLabel: (label) =>
      t("ui.clock.advance", "Advance {{label}}", { label }),
    removeLabel: (label) =>
      t("ui.clock.remove", "Remove a segment from {{label}}", { label }),
    fullHint: t("ui.clock.full", "The clock is full"),
    completedLabel: t("ui.clock.completed", "Completed"),
  };
}
