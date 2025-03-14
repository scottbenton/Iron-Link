import { getRollResultLabel } from "@/data/rollResultLabel";
import { createId } from "@/lib/id.lib";
import { getTrackTypeLabel } from "@/pages/games/sheet/components/tabs/tracks/common";
import { RollResult, RollType } from "@/repositories/shared.types";
import { TrackTypes } from "@/repositories/tracks.repository";
import { ITrackProgressRoll } from "@/services/gameLog.service";
import {
  useAddRollSnackbar,
  useSetAnnouncement,
} from "@/stores/appState.store";
import { useUID } from "@/stores/auth.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { useCallback } from "react";

import { useDataswornTranslations } from "./i18n/useDataswornTranslations";
import { useCharacterIdOptional } from "./useCharacterId";
import { useGameId } from "./useGameId";
import { useIsOwnerOfCharacter } from "./usePermissions";
import { getRoll } from "./useRollStatAndAddToLog";

export function useRollCompleteProgressTrack() {
  const t = useDataswornTranslations();
  const uid = useUID();

  const gameId = useGameId();

  const characterId = useCharacterIdOptional();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const addRoll = useGameLogStore((store) => store.createLog);
  const addRollToScreen = useAddRollSnackbar();
  const announce = useSetAnnouncement();

  const rollProgressTrack = useCallback(
    (
      trackType: TrackTypes,
      trackLabel: string,
      trackProgress: number,
      moveId: string,
    ) => {
      const challenge1 = getRoll(10);
      const challenge2 = getRoll(10);

      let result: RollResult = RollResult.WeakHit;
      if (trackProgress > challenge1 && trackProgress > challenge2) {
        result = RollResult.StrongHit;
        // Strong Hit
      } else if (trackProgress <= challenge1 && trackProgress <= challenge2) {
        result = RollResult.Miss;
      }

      const trackProgressRoll: ITrackProgressRoll = {
        id: createId(),
        gameId: gameId ?? "fake-game",
        type: RollType.TrackProgress,
        rollLabel: trackLabel,
        timestamp: new Date(),
        challenge1,
        challenge2,
        trackProgress,
        trackType,
        result,
        characterId: isCharacterOwner ? (characterId ?? null) : null,
        uid: uid ?? "",
        guidesOnly: false,
        moveId,
      };

      addRollToScreen(trackProgressRoll.id, trackProgressRoll);
      if (uid) {
        addRoll(trackProgressRoll.id, trackProgressRoll).catch(() => {});
      }

      announce(
        t(
          "datasworn.roll.trackProgress",
          "Rolled progress for {{trackType}} {{trackLabel}}. Your progress was {{trackProgress}} against a {{challenge1}} and a {{challenge2}} for a {{rollResult}}",
          {
            trackType: getTrackTypeLabel(trackType, t),
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
      announce,
      addRollToScreen,
      gameId,
      characterId,
      uid,
      isCharacterOwner,
      t,
      addRoll,
    ],
  );

  return rollProgressTrack;
}
