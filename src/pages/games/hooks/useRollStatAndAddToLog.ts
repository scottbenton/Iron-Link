import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { getRollAnnouncement } from "hooks/useRollSummary";

import { useAddRollSnackbar, useSetAnnouncement } from "stores/appState.store";
import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";

import { createId } from "lib/id.lib";

import { RollType } from "repositories/shared.types";
import { RollResult } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { useCharacterIdOptional } from "../characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "../gamePageLayout/hooks/useGameId";

interface StatRollConfig {
  statId: string;
  statLabel: string;
  statModifier: number;
  moveId?: string;
  adds?: number;
  momentum: number;
  hideSnackbar?: boolean;
  characterId?: string;
}

export function useRollStatAndAddToLog() {
  // TODO - remove ?? "" and handle the case where there is no UID
  const uid = useUID() ?? "";

  const characterId = useCharacterIdOptional();
  const gameId = useGameIdOptional();

  const { t } = useTranslation();

  const announce = useSetAnnouncement();
  const addRollSnackbar = useAddRollSnackbar();

  const addLog = useGameLogStore((store) => store.createLog);
  const updateCharacterAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );

  const rollStat = useCallback(
    (config: StatRollConfig) => {
      const resolvedCharacterId = config.characterId ?? characterId;
      const result = getStatRollResult(
        config,
        uid,
        gameId,
        resolvedCharacterId,
      );

      if (gameId) {
        addLog(result.id, result).catch(() => {});
      }
      announce(getRollAnnouncement(result, t));

      if (!config.hideSnackbar) {
        addRollSnackbar(result.id, result);
      }

      if (resolvedCharacterId && result.adds !== 0) {
        updateCharacterAdds(resolvedCharacterId, 0).catch(() => {});
      }

      return result;
    },
    [
      uid,
      characterId,
      gameId,
      t,
      announce,
      addRollSnackbar,
      addLog,
      updateCharacterAdds,
    ],
  );

  return rollStat;
}

export const getRoll = (dieMax: number) => {
  return Math.floor(Math.random() * dieMax) + 1;
};

function getStatRollResult(
  config: StatRollConfig,
  uid: string,
  gameId?: string,
  characterId?: string,
): IStatRoll {
  const { momentum, statModifier, adds, statLabel, moveId, statId } = config;

  const challenge1 = getRoll(10);
  const challenge2 = getRoll(10);
  const action = getRoll(6);

  const matchedNegativeMomentum = momentum < 0 && Math.abs(momentum) === action;
  const actionTotal = Math.min(
    10,
    (matchedNegativeMomentum ? 0 : action) + statModifier + (adds ?? 0),
  );

  let result: RollResult = RollResult.WeakHit;
  if (actionTotal > challenge1 && actionTotal > challenge2) {
    result = RollResult.StrongHit;
  } else if (actionTotal <= challenge1 && actionTotal <= challenge2) {
    result = RollResult.Miss;
  }

  const roll: IStatRoll = {
    id: createId(),
    logType: LogType.ROLL,
    gameId: gameId ?? "unknown",
    type: RollType.Stat,
    rollLabel: statLabel,
    timestamp: new Date(),
    characterId: characterId || null,
    uid: uid,
    matchedNegativeMomentum,
    guidesOnly: false,
    moveId: moveId ?? undefined,
    statKey: statId,
    action,
    actionTotal,
    challenge1,
    challenge2,
    result,
    modifier: statModifier,
    adds: adds ?? 0,
    momentumBurned: null,
  };

  return roll;
}
