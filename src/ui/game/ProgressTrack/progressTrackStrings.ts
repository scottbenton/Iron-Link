import type { TFunction } from "i18next";

import { ProgressTextStrings, describeMark, getProgressText } from "./progress";

export interface ProgressTrackStrings extends ProgressTextStrings {
  /** The plus button's name: "Mark progress on Recover the Hollow Crown". */
  markLabel: (label: string) => string;
  /** The minus button's name: "Remove progress from Recover the Hollow Crown". */
  eraseLabel: (label: string) => string;
  completedLabel: string;
  legacyLabel: string;
  /** What a mark adds, such as "2 boxes per mark". */
  markDescription: (ticks: number) => string;
  /** "Updated Recover the Hollow Crown to 3 of 10 boxes filled" */
  updated: (label: string, valueText: string) => string;
}

export function getDefaultProgressTrackStrings(
  t: TFunction,
): ProgressTrackStrings {
  return {
    ...getProgressText(t),
    markLabel: (label) =>
      t("ui.progress-track.mark", "Mark progress on {{label}}", { label }),
    eraseLabel: (label) =>
      t("ui.progress-track.erase", "Remove progress from {{label}}", { label }),
    completedLabel: t("ui.progress-track.completed", "Completed"),
    legacyLabel: t("ui.progress-track.legacy", "Legacy"),
    markDescription: (ticks) => describeMark(t, ticks),
    updated: (label, text) =>
      t("ui.progress-track.updated", "Updated {{label}} to {{text}}", {
        label,
        text,
      }),
  };
}
