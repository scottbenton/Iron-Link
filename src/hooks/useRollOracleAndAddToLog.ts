import { toaster } from "@/components/ui/toaster";
import { IOracleTableRoll } from "@/services/gameLog.service";
import { useAddRollSnackbar } from "@/stores/appState.store";
import { useUID } from "@/stores/auth.store";
import { useGameCharacter } from "@/stores/gameCharacters.store";
import { useGameLogStore } from "@/stores/gameLog.store";
import { useCallback } from "react";

import { useDataswornTranslations } from "./i18n/useDataswornTranslations";
import { useCharacterIdOptional } from "./useCharacterId";
import { useGameIdOptional } from "./useGameId";
import { useRollOracle } from "./useRollOracle";

export function useRollOracleAndAddToLog() {
  const uid = useUID();
  const characterId = useCharacterIdOptional();
  const gameId = useGameIdOptional();

  const characterOwner = useGameCharacter((character) => character?.uid);

  const addRollSnackbar = useAddRollSnackbar();

  const t = useDataswornTranslations();

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
          uid: uid ?? "",
          characterId:
            characterId && characterOwner === uid ? characterId : null,
          guidesOnly,
        };
        if (gameId) {
          if (uid) {
            addRoll(resultWithAdditions.id, resultWithAdditions).catch(
              () => {},
            );
          }
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
        toaster.error({
          description: t(
            "datasworn.roll-oracle.oracle-not-found",
            "Could not find oracle",
          ),
        });
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
      t,
      addRollSnackbar,
      characterOwner,
      addRoll,
    ],
  );

  return handleRollOracle;
}
