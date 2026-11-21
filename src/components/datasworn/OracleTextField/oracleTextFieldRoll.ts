import { getOracleCollection } from "hooks/datasworn/useOracleCollection";
import { getOracleRollable } from "hooks/datasworn/useOracleRollable";

import { IOracleTableRoll } from "services/gameLog.service";

/**
 * Which oracles an oracle text field rolls: tables to join ("Kai Vale"), or
 * one picked at random ("given name or family name"). Entries can nest.
 */
export type OracleTextFieldOracleConfig = {
  tableIds: (string | OracleTextFieldOracleConfig)[];
  joinTables?: boolean;
  joinSeparator?: string;
};

export type OracleTextFieldOracle = string | OracleTextFieldOracleConfig;

/** Whether any oracle the field names exists in the loaded rules. */
export function canRollOracleTextField(
  oracle: OracleTextFieldOracle | undefined,
): boolean {
  if (!oracle) return false;
  if (typeof oracle === "string") {
    return !!(getOracleRollable(oracle) ?? getOracleCollection(oracle));
  }
  return oracle.tableIds.some((tableId) => canRollOracleTextField(tableId));
}

/**
 * Rolls the field's oracles into one piece of text. A table that cannot be
 * rolled gives "" (so a joined roll keeps its other parts).
 */
export function rollOracleTextField(
  oracle: OracleTextFieldOracle | undefined,
  getOracleResult: (oracleId: string) => IOracleTableRoll | undefined,
  random: () => number = Math.random,
): string {
  if (!oracle) return "";
  if (typeof oracle === "string") {
    return getOracleResult(oracle)?.result ?? "";
  }
  if (oracle.joinTables) {
    return oracle.tableIds
      .map((tableId) => rollOracleTextField(tableId, getOracleResult, random))
      .join(oracle.joinSeparator ?? " ");
  }
  const picked = oracle.tableIds[Math.floor(random() * oracle.tableIds.length)];
  return rollOracleTextField(picked, getOracleResult, random);
}
