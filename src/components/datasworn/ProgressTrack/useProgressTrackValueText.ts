import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  MAX_PROGRESS_SCORE,
  TICKS_PER_BOX,
  getProgressBoxes,
} from "lib/progressTrack.lib";

/**
 * Returns a function that reads a track's ticks out as text, such as "3 of
 * 10 boxes filled, and 2 of 4 ticks", for aria-valuetext and announcements.
 */
export function useProgressTrackValueText() {
  const { t } = useTranslation();

  return useCallback(
    (value: number) => {
      const { boxes, ticks } = getProgressBoxes(value);
      if (ticks === 0) {
        return t(
          "datasworn.progress-track.value-text-boxes",
          "{{boxes}} of {{totalBoxes}} boxes filled",
          { boxes, totalBoxes: MAX_PROGRESS_SCORE },
        );
      }
      return t(
        "datasworn.progress-track.value-text-boxes-and-ticks",
        "{{boxes}} of {{totalBoxes}} boxes filled, and {{ticks}} of {{ticksPerBox}} ticks",
        {
          boxes,
          totalBoxes: MAX_PROGRESS_SCORE,
          ticks,
          ticksPerBox: TICKS_PER_BOX,
        },
      );
    },
    [t],
  );
}
