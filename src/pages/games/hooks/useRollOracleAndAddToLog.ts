import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useRollOracle } from "hooks/useRollOracle";

import { useAddRollSnackbar } from "stores/appState.store";
import { useUID } from "stores/auth.store";
import { useGameCharacter } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";

import { IOracleTableRoll } from "services/gameLog.service";

import { useCharacterIdOptional } from "../characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "../gamePageLayout/hooks/useGameId";

export function useRollOracleAndAddToLog() {
  // TODO - remove ?? "" and handle the case where there is no UID
  const uid = useUID() ?? "";
  const characterId = useCharacterIdOptional();
  const gameId = useGameIdOptional();

  const characterOwner = useGameCharacter((character) => character?.uid);

  const addRollSnackbar = useAddRollSnackbar();

  const { t } = useTranslation();

  const { error } = useSnackbar();

  const rollOracle = useRollOracle();
  const addRoll = useGameLogStore((store) => store.createLog);

  const handleRollOracle = useCallback(
    (
      oracleId: string,
      guidesOnly: boolean = false,
    ): { id: string | undefined; result: IOracleTableRoll | undefined } => {
      const result = rollOracle(oracleId);
      if (result) {
        const resultWithAdditions = {
          ...result,
          gameId: gameId ?? "fake-game",
          uid,
          characterId:
            characterId && characterOwner === uid ? characterId : null,
          guidesOnly,
        };
        if (gameId) {
          addRoll(resultWithAdditions.id, resultWithAdditions).catch(() => {});
          addRollSnackbar(resultWithAdditions.id, resultWithAdditions);
          return {
            id: resultWithAdditions.id,
            result: resultWithAdditions,
          };
        }
        addRollSnackbar(undefined, resultWithAdditions);
        return {
          id: undefined,
          result: resultWithAdditions,
        };
      } else {
        error(
          t("datasworn.roll-oracle.oracle-not-found", "Could not find oracle"),
        );
      }
      return {
        id: undefined,
        result: undefined,
      };
    },
    [
      uid,
      characterId,
      gameId,
      rollOracle,
      error,
      t,
      addRollSnackbar,
      characterOwner,
      addRoll,
    ],
  );

  return handleRollOracle;
}
