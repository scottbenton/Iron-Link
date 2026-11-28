import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useMomentumParameters } from "pages/games/characterSheet/hooks/useMomentumResetValue";

import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";

import { RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

import { copyRollToClipboard } from "./copyRollToClipboard";
import { getBurnMomentumResult } from "./rollActions";

/**
 * What a roll's actions do, wherever the roll is shown: the game log, or a
 * recent roll's card. Which of them apply is `getRollActionAvailability`.
 */
export function useRollActionRunner() {
  const { t } = useTranslation();
  const { error, success } = useSnackbar();

  const currentCharacterId = useCharacterIdOptional();
  const momentum = useGameCharactersStore((store) =>
    currentCharacterId
      ? (store.characters[currentCharacterId]?.momentum ?? 0)
      : 0,
  );
  const momentumResetValue = useMomentumParameters().resetValue;

  const burnMomentumOnLog = useGameLogStore((store) => store.burnMomentumOnLog);
  const setMomentum = useGameCharactersStore(
    (store) => store.updateCharacterMomentum,
  );
  const deleteLog = useGameLogStore((store) => store.deleteLog);

  const copy = useCallback(
    (roll: IGameLogRoll) => {
      copyRollToClipboard(roll)
        .then((outcome) => {
          if (outcome === "copied") {
            success(t("game.log.roll-copied", "Copied roll to clipboard"));
          } else {
            error(
              t(
                "game.log.roll-copy-unsupported",
                "Copying this roll type is not supported",
              ),
            );
          }
        })
        .catch(() => {
          error(t("game.log.roll-copy-failed", "Failed to copy roll"));
        });
    },
    [t, success, error],
  );

  const burnMomentum = useCallback(
    (rollId: string, roll: IGameLogRoll) => {
      if (!currentCharacterId || roll.type !== RollType.Stat || !momentum) {
        return;
      }
      Promise.all([
        burnMomentumOnLog(
          rollId,
          momentum,
          getBurnMomentumResult(roll, momentum),
        ),
        setMomentum(currentCharacterId, momentumResetValue),
      ])
        .catch(() => {})
        .then(() => {
          success(t("game.log.momentum-burned", "Burned Momentum"));
        });
    },
    [
      currentCharacterId,
      momentum,
      momentumResetValue,
      burnMomentumOnLog,
      setMomentum,
      success,
      t,
    ],
  );

  const deleteRoll = useCallback(
    (rollId: string) => {
      deleteLog(rollId).catch(() => {});
    },
    [deleteLog],
  );

  return { copy, burnMomentum, deleteRoll, currentCharacterId, momentum };
}
