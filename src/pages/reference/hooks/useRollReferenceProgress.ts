import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { getRoll } from "pages/games/hooks/useRollStatAndAddToLog";

import { useAddRollSnackbar, useSetAnnouncement } from "stores/appState.store";
import { useUID } from "stores/auth.store";

import { getRollResultLabel } from "data/rollResultLabel";

import { createId } from "lib/id.lib";
import { getProgressRollResult } from "lib/progressTrack.lib";

import { RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

import {
  ISpecialTrackProgressRoll,
  ITrackProgressRoll,
  LogType,
} from "services/gameLog.service";

// The reference page has no game, so this rolls a progress score against the
// challenge dice and shows the usual roll snackbar and announcement, saving
// nothing. A game's progress roll hook needs a game id.
export function useRollReferenceProgress() {
  const { t } = useTranslation();
  const uid = useUID() ?? "";
  const addRollSnackbar = useAddRollSnackbar();
  const announce = useSetAnnouncement();

  return useCallback(
    (config: {
      moveId: string;
      moveName: string;
      progressScore: number;
      trackType?: TrackTypes;
      specialTrack?: { key: string; label: string };
    }) => {
      const { moveId, moveName, progressScore, trackType, specialTrack } =
        config;
      const challenge1 = getRoll(10);
      const challenge2 = getRoll(10);
      const result = getProgressRollResult(
        progressScore,
        challenge1,
        challenge2,
      );

      const base = {
        id: createId(),
        logType: LogType.ROLL as const,
        gameId: "reference",
        timestamp: new Date(),
        challenge1,
        challenge2,
        trackProgress: progressScore,
        result,
        characterId: null,
        uid,
        guidesOnly: false,
        moveId,
      };

      const roll: ITrackProgressRoll | ISpecialTrackProgressRoll = specialTrack
        ? {
            ...base,
            type: RollType.SpecialTrackProgress,
            rollLabel: specialTrack.label,
            specialTrackKey: specialTrack.key,
          }
        : {
            ...base,
            type: RollType.TrackProgress,
            rollLabel: moveName,
            trackType: trackType ?? TrackTypes.Vow,
          };

      addRollSnackbar(roll.id, roll);
      announce(
        t(
          "reference.roll.progress-announcement",
          "Rolled {{moveName}}. Your progress was {{trackProgress}} against a {{challenge1}} and a {{challenge2}} for a {{rollResult}}.",
          {
            moveName,
            trackProgress: progressScore,
            challenge1,
            challenge2,
            rollResult: getRollResultLabel(result),
          },
        ),
      );

      return roll;
    },
    [addRollSnackbar, announce, t, uid],
  );
}
