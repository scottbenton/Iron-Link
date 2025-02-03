import { useOracleRollable } from "hooks/datasworn/useOracleRollable";

import { IOracleTableRoll } from "services/gameLog.service";

import { RollContainer, RollResult, RollTitle, RollValues } from "./common";

export interface OracleRollSnackbarProps {
  rollId: string | undefined;
  roll: IOracleTableRoll;
  isExpanded: boolean;
}

export function OracleRollSnackbar(props: OracleRollSnackbarProps) {
  const { roll, isExpanded } = props;

  const oracle = useOracleRollable(roll.oracleId ?? "");

  return (
    <>
      <RollTitle
        overline={roll.oracleCategoryName}
        title={oracle?.name ?? roll.rollLabel}
        isExpanded={isExpanded}
      />
      <RollContainer>
        <RollValues d10Results={roll.roll} isExpanded={isExpanded} />
        <RollResult
          markdown={roll.result}
          extras={
            roll.oracleId &&
            !!oracle?.match &&
            !Array.isArray(roll.roll) &&
            checkIfMatch(roll.roll)
              ? ["Match"]
              : undefined
          }
        />
      </RollContainer>
    </>
  );
}

// A bit hacky, check if the last two digits of the number are equal to each other.
function checkIfMatch(num: number) {
  return num % 10 === Math.floor(num / 10) % 10;
}
