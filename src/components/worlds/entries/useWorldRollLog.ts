import { useCallback } from "react";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { useGameCharacter } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";

import { createId } from "lib/id.lib";
import type { WorldOracleRollListener } from "lib/worldOracleRoll";

import { ReadPermissions, RollType } from "repositories/shared.types";

import { IOracleTableRoll, LogType } from "services/gameLog.service";
import type { IWorldEntry } from "services/worldEntries.service";

// Whether a roll for this entry (and field) may only reach Guides' logs.
export function isGuidesOnlyWorldRoll(
  entry: Pick<IWorldEntry, "readPermissions">,
  field?: { gmOnly: boolean },
): boolean {
  return (
    entry.readPermissions === ReadPermissions.OnlyGuides || !!field?.gmOnly
  );
}

// Logs world oracle rolls to the game they were made in, as the oracle's name
// and the plain result: the game's own playset may not hold that oracle, so
// the log cannot look anything up later. Outside a game nothing is logged.
//
// The overline names the entry the roll was for. Rolls for something only
// Guides can see are logged for Guides only.
export function useWorldRollLog(entryName: string) {
  const gameId = useGameIdOptional();
  const uid = useUID();
  const characterId = useCharacterIdOptional();
  const characterOwner = useGameCharacter((character) => character?.uid);
  const createLog = useGameLogStore((store) => store.createLog);

  return useCallback(
    (guidesOnly: boolean): WorldOracleRollListener | undefined => {
      if (!gameId || !uid) return undefined;
      return (record) => {
        const log: IOracleTableRoll = {
          id: createId(),
          logType: LogType.ROLL,
          type: RollType.OracleTable,
          gameId,
          uid,
          characterId:
            characterId && characterOwner === uid ? characterId : null,
          guidesOnly,
          timestamp: new Date(),
          rollLabel: record.oracleName,
          oracleCategoryName: entryName,
          oracleId: record.oracleId,
          roll: record.roll,
          result: record.text,
          match: false,
          cursedDieRoll: null,
          cursedDieAdditiveResult: null,
          wasCursed: null,
        };
        createLog(log.id, log).catch(() => {});
      };
    },
    [gameId, uid, characterId, characterOwner, createLog, entryName],
  );
}
