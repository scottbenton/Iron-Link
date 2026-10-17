import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAddRollSnackbar, useSetAnnouncement } from "stores/appState.store";
import { useUID } from "stores/auth.store";
import { useGameLogStore } from "stores/gameLog.store";

import { getRollResultLabel } from "data/rollResultLabel";

import { createId } from "lib/id.lib";
import {
  getProgressRollResult,
  getSpecialTrackProgressScore,
} from "lib/progressTrack.lib";

import { RollType, SpecialTrack } from "repositories/shared.types";

import { ISpecialTrackProgressRoll, LogType } from "services/gameLog.service";

import { useCharacterIdOptional } from "../characterSheet/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../characterSheet/hooks/useIsOwnerOfCharacter";
import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { getRoll } from "./useRollStatAndAddToLog";

export function useRollCompleteSpecialTrack() {
  const { t } = useTranslation();
  // TODO - remove ?? "" and handle the case where there is no UID
  const uid = useUID() ?? "";

  const gameId = useGameId();

  const characterId = useCharacterIdOptional();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const addRoll = useGameLogStore((store) => store.createLog);
  const addRollToScreen = useAddRollSnackbar();
  const announce = useSetAnnouncement();

  const rollSpecialTrack = useCallback(
    (
      specialTrackKey: string,
      trackLabel: string,
      track: SpecialTrack,
      moveId: string,
    ) => {
      const trackProgress = getSpecialTrackProgressScore(
        track.value,
        track.isLegacy ?? false,
      );

      const challenge1 = getRoll(10);
      const challenge2 = getRoll(10);

      const result = getProgressRollResult(
        trackProgress,
        challenge1,
        challenge2,
      );

      const trackProgressRoll: ISpecialTrackProgressRoll = {
        type: RollType.SpecialTrackProgress,
        logType: LogType.ROLL,
        rollLabel: trackLabel,
        timestamp: new Date(),
        challenge1,
        challenge2,
        trackProgress,
        specialTrackKey,
        result,
        characterId: isCharacterOwner ? (characterId ?? null) : null,
        uid,
        id: createId(),
        gameId,
        guidesOnly: false,
        moveId,
      };

      addRollToScreen(trackProgressRoll.id, trackProgressRoll);
      addRoll(trackProgressRoll.id, trackProgressRoll).catch(() => {});

      announce(
        t(
          "datasworn.roll.trackProgress",
          "Rolled progress for {{trackLabel}}. Your progress was {{trackProgress}} against a {{challenge1}} and a {{challenge2}} for a {{rollResult}}",
          {
            trackLabel,
            trackProgress,
            challenge1,
            challenge2,
            rollResult: getRollResultLabel(result),
          },
        ),
      );

      return result;
    },
    [
      gameId,
      announce,
      addRollToScreen,
      characterId,
      uid,
      isCharacterOwner,
      t,
      addRoll,
    ],
  );

  return rollSpecialTrack;
}
