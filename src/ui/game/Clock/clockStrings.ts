export interface ClockStrings {
  /** "3 of 6 segments filled" */
  valueText: (value: number, segments: number) => string;
  /** Announced after a change by pointer: "Siege, 3 of 6 segments filled". */
  changed: (label: string, valueText: string) => string;
  /** The centre button's name: "Advance The Iron Siege falls". */
  advanceLabel: (label: string) => string;
  /** The centre's hint once the clock is full. */
  fullHint: string;
}

export const defaultClockStrings: ClockStrings = {
  valueText: (value, segments) => `${value} of ${segments} segments filled`,
  changed: (label, text) => `${label}, ${text}`,
  advanceLabel: (label) => `Advance ${label}`,
  fullHint: "The clock is full",
};
