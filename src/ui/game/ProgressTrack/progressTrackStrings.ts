import {
  ProgressTextStrings,
  defaultProgressText,
  describeMark,
} from "./progress";

export interface ProgressTrackStrings extends ProgressTextStrings {
  /** The plus button's name: "Mark progress on Recover the Hollow Crown". */
  markLabel: (label: string) => string;
  /** The minus button's name: "Remove progress from Recover the Hollow Crown". */
  eraseLabel: (label: string) => string;
  completedLabel: string;
  legacyLabel: string;
  /** What a mark adds, such as "2 boxes per progress". */
  markDescription: (ticks: number) => string;
  /** "Updated Recover the Hollow Crown to 3 of 10 boxes filled" */
  updated: (label: string, valueText: string) => string;
}

export const defaultProgressTrackStrings: ProgressTrackStrings = {
  ...defaultProgressText,
  markLabel: (label) => `Mark progress on ${label}`,
  eraseLabel: (label) => `Remove progress from ${label}`,
  completedLabel: "Completed",
  legacyLabel: "Legacy",
  markDescription: describeMark,
  updated: (label, text) => `Updated ${label} to ${text}`,
};
