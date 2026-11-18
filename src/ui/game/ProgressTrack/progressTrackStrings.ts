import {
  ProgressTextStrings,
  defaultProgressText,
  describeMark,
} from "./progress";

export interface ProgressTrackStrings extends ProgressTextStrings {
  markLabel: string;
  eraseLabel: string;
  completedLabel: string;
  legacyLabel: string;
  /** "Progress" before the score. */
  scoreLabel: string;
  /** What a mark adds, such as "2 boxes per mark". */
  markDescription: (ticks: number) => string;
  /** "Updated Recover the Hollow Crown to 3 of 10 boxes filled" */
  updated: (label: string, valueText: string) => string;
  /** "6 XP earned, 2 spent" */
  xp: (earned: number, spent: number) => string;
}

export const defaultProgressTrackStrings: ProgressTrackStrings = {
  ...defaultProgressText,
  markLabel: "Mark Progress",
  eraseLabel: "Erase",
  completedLabel: "Completed",
  legacyLabel: "Legacy",
  scoreLabel: "Progress",
  markDescription: describeMark,
  updated: (label, text) => `Updated ${label} to ${text}`,
  xp: (earned, spent) => `${earned} XP earned, ${spent} spent`,
};
