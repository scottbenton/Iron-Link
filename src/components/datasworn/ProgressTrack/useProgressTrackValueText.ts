import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  getProgressText,
  getProgressValueText,
} from "ui/game/ProgressTrack/progress";

/**
 * Returns a function that reads a track's ticks out as text, such as "3 of
 * 10 boxes filled, and 2 of 4 ticks", for aria-valuetext and announcements.
 * The words are the library's, so the app's tracks and the library's read
 * alike.
 */
export function useProgressTrackValueText() {
  const { t } = useTranslation();

  return useCallback(
    (value: number) => getProgressValueText(value, getProgressText(t)),
    [t],
  );
}
