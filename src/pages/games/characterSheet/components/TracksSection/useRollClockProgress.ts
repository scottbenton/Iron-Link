import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { getRollAnnouncement } from "hooks/useRollSummary";

import { useSetAnnouncement } from "stores/appState.store";
import { useTracksStore } from "stores/tracks.store";

import { askTheOracleEnumMap } from "data/askTheOracle";

import { TrackTypes } from "repositories/tracks.repository";

import { getClockOracle } from "./trackMappings";

/**
 * Roll Progress on a clock: asks the oracle at the clock's odds and, on a
 * yes, fills one segment (two on a match). One announcement carries both the
 * oracle's answer and what it did, since a second would replace the first.
 * It starts from the clock's value on screen, which may not have saved yet,
 * and hands the new value to `advance` to show and save.
 */
export function useRollClockProgress(
  shownValue: (clockId: string, saved: number) => number,
  advance: (clockId: string, value: number) => void,
) {
  const { t } = useTranslation();
  const announce = useSetAnnouncement();
  const rollOracle = useRollOracleAndAddToLog();

  return useCallback(
    (clockId: string) => {
      const saved = useTracksStore.getState().tracks[clockId];
      if (!saved || saved.type !== TrackTypes.Clock) return;
      const clock = { ...saved, value: shownValue(clockId, saved.value) };

      const oracleId = askTheOracleEnumMap[getClockOracle(clock.oracleKey)]._id;
      const { result } = rollOracle(oracleId, false, { announce: false });
      const rolled = result ? getRollAnnouncement(result, t) + " " : "";

      if (result?.result === "Yes") {
        const add = result.match ? 2 : 1;
        advance(clockId, Math.min(clock.value + add, clock.segments));
        announce(
          rolled +
            t(
              "character.character-sidebar.tracks-clock-roll-progress-announcement-yes",
              "Clock {{clockLabel}} progressed by {{add}} segment(s) for a total of {{value}} of {{total}} segments",
              {
                clockLabel: clock.label,
                add,
                value: Math.min(clock.value + add, clock.segments),
                total: clock.segments,
              },
            ),
        );
      } else {
        announce(
          rolled +
            t(
              "character.character-sidebar.tracks-clock-roll-progress-announcement-no",
              "Clock {{clockLabel}} did not progress",
              { clockLabel: clock.label },
            ),
        );
      }
    },
    [announce, rollOracle, t, shownValue, advance],
  );
}
