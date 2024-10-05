import { Datasworn } from "@datasworn/core";
import { OracleTableRoll, RollType } from "types/DieRolls.type";
import { rollDie } from "lib/rollDie";
import { getOracleRollable } from "./datasworn/useOracleRollable";
import { getOracleCollection } from "./datasworn/useOracleCollection";
import { useDataswornTree } from "atoms/dataswornTree.atom";
import { useCallback } from "react";

export function useRollOracle() {
  const tree = useDataswornTree();

  const handleRollOracle = useCallback(
    (oracleId: string) => {
      const oracle =
        getOracleRollable(oracleId, tree) ??
        getOracleCollection(oracleId, tree);
      if (!oracle) {
        console.error("Oracle not found");
        return undefined;
      }
      return rollOracle(oracle, null, "uid", false);
    },
    [tree]
  );

  return handleRollOracle;
}

export function rollOracle(
  oracle: Datasworn.OracleCollection | Datasworn.OracleRollable,
  characterId: string | null,
  uid: string,
  gmsOnly: boolean
): OracleTableRoll | undefined {
  // We cannot roll across multiple tables like this
  if (oracle.oracle_type === "tables") {
    console.error("Oracle table collections cannot be rolled");
    return undefined;
  } else if (
    oracle.oracle_type === "table_shared_text" ||
    oracle.oracle_type === "table_shared_text2" ||
    oracle.oracle_type === "table_shared_text3"
  ) {
    console.error(
      "Shared Results tables cannot be rolled - please specify a contents table to roll instead."
    );
    return undefined;
  }

  let resultString: string | undefined = undefined;
  let rolls: number | number[] | undefined = undefined;

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
    const rollResult = rollOracleColumn(oracle);

    // We need to roll other tables
    // if (rollResult?.result.oracle_rolls) {
    // }
    if (rollResult) {
      rolls = rollResult.roll;
      resultString = rollResult.result.text;
    }
  }

  if (resultString && rolls !== undefined) {
    return {
      type: RollType.OracleTable,
      rollLabel: oracle.name,
      timestamp: new Date(),
      characterId,
      uid,
      gmsOnly,
      roll: rolls,
      result: resultString,
      oracleId: oracle._id,
    };
  }

  return undefined;
}

function rollOracleColumn(column: Datasworn.OracleRollable):
  | {
      roll: number;
      result: Datasworn.OracleRollableRow;
    }
  | undefined {
  const roll = rollDie(column.dice);
  if (!roll) {
    return undefined;
  }
  const result = column.rows.find(
    (row) => row.roll && row.roll.min <= roll && row.roll.max >= roll
  );
  if (!result) {
    console.error("Could not find result for roll", roll);
    return undefined;
  }

  return {
    roll,
    result,
  };
}
