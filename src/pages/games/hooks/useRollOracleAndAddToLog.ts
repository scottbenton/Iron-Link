import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useRollOracle } from "hooks/useRollOracle";
import { getRollAnnouncement } from "hooks/useRollSummary";

import { useAddRollSnackbar, useSetAnnouncement } from "stores/appState.store";
import { useUID } from "stores/auth.store";
import { useGameLogStore } from "stores/gameLog.store";

import { IOracleTableRoll } from "services/gameLog.service";

import { useCanEditCharacter } from "../characterSheet/hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "../gamePageLayout/hooks/useGameId";

export interface RollOracleOptions {
  // Leave the announcement to the caller, which reads the result with more.
  announce?: boolean;
}

export function useRollOracleAndAddToLog() {
  // TODO - remove ?? "" and handle the case where there is no UID
  const uid = useUID() ?? "";
  const characterId = useCharacterIdOptional();
  const gameId = useGameIdOptional();

  const canEditCharacter = useCanEditCharacter();

  const addRollSnackbar = useAddRollSnackbar();
  const announce = useSetAnnouncement();

  const { t } = useTranslation();

  const { error } = useSnackbar();

  const rollOracle = useRollOracle();
  const addRoll = useGameLogStore((store) => store.createLog);

  const handleRollOracle = useCallback(
    (
      oracleId: string,
      guidesOnly: boolean = false,
      options: RollOracleOptions = {},
    ): { id: string | undefined; result: IOracleTableRoll | undefined } => {
      const result = rollOracle(oracleId);
      if (result) {
        const resultWithAdditions = {
          ...result,
          gameId: gameId ?? "fake-game",
          uid,
          characterId: characterId && canEditCharacter ? characterId : null,
          guidesOnly,
        };
        // The full result, as its roll card reads it. A caller that says more
        // about the roll (a clock's progress) announces it with its own news.
        if (options.announce !== false) {
          announce(getRollAnnouncement(resultWithAdditions, t));
        }

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
      announce,
      canEditCharacter,
      addRoll,
    ],
  );

  return handleRollOracle;
}
