import { useOracleRollable } from "@/hooks/datasworn/useOracleRollable";
import { IOracleTableRoll } from "@/services/gameLog.service";
import { Card } from "@chakra-ui/react";
import { ReactNode } from "react";

import { GameLogHeader } from "./GameLogHeader";
import { GameLogRollResult } from "./GameLogRollResult";
import { GameLogRollValues } from "./GameLogRollValues";

export interface GameLogOracleRollProps {
  roll: IOracleTableRoll;
  actions?: ReactNode;
}

export function GameLogOracleRoll(props: GameLogOracleRollProps) {
  const { roll, actions } = props;

  const oracle = useOracleRollable(roll.oracleId);

  return (
    <>
      <GameLogHeader
        overline={roll.oracleCategoryName}
        title={oracle?.name ?? roll.rollLabel}
        actions={actions}
      />
      <Card.Body display="flex" flexDirection="row">
        <GameLogRollValues
          d10Results={roll.roll}
          cursedResult={roll.cursedDieRoll ?? undefined}
        />
        <GameLogRollResult
          markdown={roll.result}
          secondaryMarkdown={roll.cursedDieAdditiveResult ?? undefined}
          extras={
            roll.oracleId &&
            !!oracle?.match &&
            !Array.isArray(roll.roll) &&
            checkIfMatch(roll.roll)
              ? ["Match"]
              : undefined
          }
        />
      </Card.Body>
    </>
  );
}

// A bit hacky, check if the last two digits of the number are equal to each other.
function checkIfMatch(num: number) {
  return num % 10 === Math.floor(num / 10) % 10;
}
