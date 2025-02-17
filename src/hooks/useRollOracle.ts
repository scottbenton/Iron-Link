import { Datasworn } from "@datasworn/core";
import { useCallback } from "react";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { createId } from "lib/id.lib";
import { rollDie } from "lib/rollDie";

import { RollType } from "repositories/shared.types";

import { IOracleTableRoll } from "services/gameLog.service";

import { getOracleCollection } from "./datasworn/useOracleCollection";
import { getOracleRollable } from "./datasworn/useOracleRollable";

export function useRollOracle() {
  const gameId = useGameIdOptional();
  const uid = useUID();
  const characterId = useCharacterIdOptional();
  const shouldRollCursedDieIfOracleSupports = useDataswornTreeStore(
    (store) => store.autoRollCursedDie,
  );

  const handleRollOracle = useCallback(
    (oracleId: string) =>
      rollOracle(
        oracleId,
        characterId ?? null,
        uid ?? "",
        gameId ?? "fake-game",
        false,
        shouldRollCursedDieIfOracleSupports,
      ),
    [uid, characterId, gameId, shouldRollCursedDieIfOracleSupports],
  );

  return handleRollOracle;
}

export function rollOracle(
  oracleId: string,
  characterId: string | null,
  uid: string,
  gameId: string,
  guidesOnly: boolean,
  shouldRollCursedDieIfOracleSupports: boolean,
): IOracleTableRoll | undefined {
  const oracle = getOracleRollable(oracleId) ?? getOracleCollection(oracleId);
  // We cannot roll across multiple tables like this
  if (!oracle) {
    console.error(`Could not find oracle with id ${oracleId}.`);
    return undefined;
  }

  const isAlreadyCursedTable = !!oracle.tags?.sundered_isles?.cursed_version_of;

  const cursedOracleTag = shouldRollCursedDieIfOracleSupports
    ? oracle.tags?.sundered_isles?.cursed_by
    : undefined;

  const cursedOracleId =
    typeof cursedOracleTag === "string" ? cursedOracleTag : undefined;

  const cursedOracle = cursedOracleId
    ? getOracleRollable(cursedOracleId)
    : undefined;

  const isCursedOracleAdditive =
    cursedOracle?.tags?.sundered_isles?.curse_behavior === "add_result";

  const shouldRollCursedDie =
    shouldRollCursedDieIfOracleSupports && cursedOracleId && cursedOracle;

  const cursedDieRoll = shouldRollCursedDie ? rollDie("1d10") : undefined;

  const baseOracle =
    cursedDieRoll === 10 && cursedOracle && !isCursedOracleAdditive
      ? cursedOracle
      : oracle;

  const baseResult = getOracleResult(baseOracle);
  const cursedDieResult =
    cursedDieRoll === 10 && cursedOracle && isCursedOracleAdditive
      ? getOracleResult(cursedOracle)
      : undefined;

  if (baseResult?.resultString && baseResult.rolls !== undefined) {
    return {
      id: createId(),
      gameId: gameId,
      type: RollType.OracleTable,
      oracleCategoryName: baseResult.categoryName,
      rollLabel: oracle.name,
      timestamp: new Date(),
      characterId,
      uid,
      guidesOnly,
      roll: baseResult.rolls,
      result: baseResult.resultString,
      oracleId: oracle._id,
      match: baseResult.matched,
      cursedDieAdditiveResult: cursedDieResult?.resultString ?? null,
      cursedDieRoll: cursedDieRoll ?? null,
      wasCursed:
        isAlreadyCursedTable || (cursedDieRoll === 10 && !!cursedOracle),
    };
  }

  return undefined;
}

function getOracleResult(
  oracle:
    | Datasworn.OracleRollable
    | Datasworn.EmbeddedOracleRollable
    | Datasworn.OracleCollection,
) {
  if (oracle.oracle_type === "tables") {
    console.error("Oracle table collections cannot be rolled");
    return undefined;
  } else if (
    oracle.oracle_type === "table_shared_text" ||
    oracle.oracle_type === "table_shared_text2" ||
    oracle.oracle_type === "table_shared_text3"
  ) {
    console.error(
      "Shared Results tables cannot be rolled - please specify a contents table to roll instead.",
    );
    return undefined;
  }
  let resultString: string | undefined = undefined;
  let rolls: number | number[] | undefined = undefined;
  let matched = false;

  let categoryName: string | undefined = undefined;

  if (oracle.oracle_type === "table_shared_rolls") {
    const tmpRolls: number[] = [];
    resultString = Object.values(oracle.contents ?? {})
      .sort((c1, c2) => c1.name.localeCompare(c2.name))
      .map((col) => {
        const rollResult = rollOracleColumn(col);
        if (!rollResult) {
          return "";
        } else {
          tmpRolls.push(rollResult.roll);
          return `* ${col.name}: ${rollResult.result.text}`;
        }
      })
      .join("\n");
    rolls = tmpRolls;
  } else {
    const oracleCollectionId = oracle._id
      .replace("oracle_rollable", "oracle_collection")
      .split("/")
      .slice(0, -1)
      .join("/");
    const oracleCollection = getOracleCollection(oracleCollectionId);
    categoryName = oracleCollection?.name;

    const rollResult = rollOracleColumn(oracle);

    // We need to roll other tables
    if (rollResult) {
      matched = rollResult.matched;
      if (rollResult.result.oracle_rolls) {
        const oracleRolls = rollResult.result.oracle_rolls;
        const results: string[] = [];
        oracleRolls.map((oracleRoll) => {
          const subRollId = oracleRoll.oracle ?? oracle._id;
          if (oracleRoll.auto) {
            for (let i = 0; i < oracleRoll.number_of_rolls; i++) {
              const subOracle = getOracleRollable(subRollId);
              if (subOracle) {
                const subResult = getOracleResult(subOracle);
                if (subResult?.resultString) {
                  results.push(subResult.resultString);
                }
              }
            }
          }
        });
        rolls = rollResult.roll;
        resultString = results.join(", ");
      }
      if (!resultString) {
        rolls = rollResult.roll;
        resultString = rollResult.result.text;
      }
    }
  }

  return {
    rolls,
    resultString,
    matched,
    categoryName,
  };
}

function rollOracleColumn(
  column: Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable,
):
  | {
      roll: number;
      result: Datasworn.OracleRollableRow;
      matched: boolean;
    }
  | undefined {
  const roll = rollDie(column.dice);
  if (!roll) {
    return undefined;
  }
  const result = column.rows.find(
    (row) => row.roll && row.roll.min <= roll && row.roll.max >= roll,
  );
  if (!result) {
    console.error("Could not find result for roll", roll);
    return undefined;
  }

  return {
    roll,
    result,
    matched: checkIfMatch(column.dice, roll),
  };
}

// A bit hacky, check if the last two digits of the number are equal to each other.
function checkIfMatch(dieExpression: string, num: number) {
  if (dieExpression !== "1d100") return false;

  return num % 10 === Math.floor(num / 10) % 10;
}
