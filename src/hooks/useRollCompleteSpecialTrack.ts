import { createGameLogToast } from "@/components/datasworn/GameLogToaster";
import { getRollResultLabel } from "@/data/rollResultLabel";
import { createId } from "@/lib/id.lib";
import { RollResult, RollType } from "@/repositories/shared.types";
import { ISpecialTrackProgressRoll } from "@/services/gameLog.service";
import { useSetAnnouncement } from "@/stores/appState.store";
import { useUID } from "@/stores/auth.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useCharacterIdOptional } from "./useCharacterId";
import { useGameId } from "./useGameId";
import { useIsOwnerOfCharacter } from "./usePermissions";
import { getRoll } from "./useRollStatAndAddToLog";

export function useRollCompleteSpecialTrack() {
  const { t } = useTranslation();
  // TODO - remove ?? "" and handle the case where there is no UID
  const uid = useUID() ?? "";

  const gameId = useGameId();

  const characterId = useCharacterIdOptional();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const addRoll = useGameLogStore((store) => store.createLog);
  const announce = useSetAnnouncement();

  const rollSpecialTrack = useCallback(
    (
      specialTrackKey: string,
      trackLabel: string,
      trackProgress: number,
      moveId: string,
    ) => {
      const challenge1 = getRoll(10);
      const challenge2 = getRoll(10);

      let result: RollResult = RollResult.WeakHit;
      if (trackProgress > challenge1 && trackProgress > challenge2) {
        result = RollResult.StrongHit;
      } else if (trackProgress <= challenge1 && trackProgress <= challenge2) {
        result = RollResult.Miss;
      }

      const trackProgressRoll: ISpecialTrackProgressRoll = {
        type: RollType.SpecialTrackProgress,
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

      createGameLogToast(trackProgressRoll);
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
    [gameId, announce, characterId, uid, isCharacterOwner, t, addRoll],
  );

  return rollSpecialTrack;
}
