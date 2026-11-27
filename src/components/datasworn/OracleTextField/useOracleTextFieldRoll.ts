import { useCallback, useMemo } from "react";

import { useRollOracle } from "hooks/useRollOracle";

import {
  OracleTextFieldOracle,
  canRollOracleTextField,
  rollOracleTextField,
} from "./oracleTextFieldRoll";

/**
 * Rolls an oracle text field's oracles, in the shape the library's
 * `OracleTextField` takes as `onRoll`: the text, or `undefined` when nothing
 * could be rolled. `canRoll` is false when none of its oracles exist.
 */
export function useOracleTextFieldRoll(
  oracle: OracleTextFieldOracle | undefined,
): { canRoll: boolean; roll: () => string | undefined } {
  const getOracleResult = useRollOracle();
  const canRoll = useMemo(() => canRollOracleTextField(oracle), [oracle]);
  const roll = useCallback(() => {
    const result = rollOracleTextField(oracle, getOracleResult);
    return result === "" ? undefined : result;
  }, [oracle, getOracleResult]);
  return { canRoll, roll };
}
