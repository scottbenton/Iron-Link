export interface XPTrackStrings {
  label: string;
  /** "8 earned, 3 spent, 5 to spend" for screen readers and the summary. */
  summary: (earned: number, spent: number, available: number) => string;
  earnedLabel: string;
  spentLabel: string;
  addEarned: string;
  removeEarned: string;
  addSpent: string;
  removeSpent: string;
  /** Announced after a change: "Experience: 8 earned, 3 spent, 5 to spend". */
  changed: (label: string, summary: string) => string;
}

export const defaultXPTrackStrings: XPTrackStrings = {
  label: "Experience",
  summary: (earned, spent, available) =>
    `${earned} earned, ${spent} spent, ${available} to spend`,
  earnedLabel: "Earned",
  spentLabel: "Spent",
  addEarned: "Mark 1 experience",
  removeEarned: "Erase 1 experience",
  addSpent: "Spend 1 experience",
  removeSpent: "Unspend 1 experience",
  changed: (label, summary) => `${label}: ${summary}`,
};
