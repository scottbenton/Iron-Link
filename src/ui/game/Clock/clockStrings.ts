export interface ClockStrings {
  /** "3 of 6 segments filled" */
  valueText: (value: number, segments: number) => string;
  /** Announced after a change by pointer: "Siege, 3 of 6 segments filled". */
  changed: (label: string, valueText: string) => string;
}

export const defaultClockStrings: ClockStrings = {
  valueText: (value, segments) => `${value} of ${segments} segments filled`,
  changed: (label, text) => `${label}, ${text}`,
};
