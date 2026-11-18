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

export const defaultClockStrings: ClockStrings = {
  valueText: (value, segments) => `${value} of ${segments} segments filled`,
  changed: (label, text) => `${label}, ${text}`,
  advanceLabel: (label) => `Advance ${label}`,
  removeLabel: (label) => `Remove a segment from ${label}`,
  fullHint: "The clock is full",
  completedLabel: "Completed",
};
