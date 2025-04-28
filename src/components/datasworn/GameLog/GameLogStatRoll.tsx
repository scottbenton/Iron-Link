import { getRollResultLabel } from "@/data/rollResultLabel";
import { useMove } from "@/hooks/datasworn/useMove";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { IStatRoll } from "@/services/gameLog.service";
import { CardBody } from "@chakra-ui/react";

import { GameLogHeader } from "./GameLogHeader";
import { GameLogRollResult } from "./GameLogRollResult";
import { GameLogRollValues } from "./GameLogRollValues";

export interface GameLogStatRollProps {
  roll: IStatRoll;
}

export function GameLogStatRoll(props: GameLogStatRollProps) {
  const { roll } = props;

  const t = useDataswornTranslations();

  const move = useMove(roll.moveId);
  const resultLabel = getRollResultLabel(roll.result);

  return (
    <>
      <GameLogHeader
        title={move ? move.name : roll.rollLabel}
        overline={move ? roll.rollLabel : undefined}
      />
      <CardBody display="flex" flexDirection="row">
        <GameLogRollValues
          d6Result={{
            action: roll.action,
            modifier: roll.modifier,
            adds: roll.adds,
            rollTotal: roll.actionTotal,
          }}
          crossOutD6={!!roll.momentumBurned}
          crossOutD6Value={roll.matchedNegativeMomentum}
          d10Results={[roll.challenge1, roll.challenge2]}
          fixedResult={
            roll.momentumBurned
              ? {
                  title: t("momentum-burned", "Momentum"),
                  value: roll.momentumBurned,
                }
              : undefined
          }
        />
        <GameLogRollResult
          result={resultLabel}
          extras={[
            ...(roll.challenge1 === roll.challenge2
              ? [t("match", "Match")]
              : []),
            ...(roll.action === 1
              ? [t("one-on-the-action-die", "One on the action die")]
              : []),
            ...(roll.matchedNegativeMomentum
              ? [t("matched-negative-momentum", "Matched negative momentum")]
              : []),
          ]}
        />
      </CardBody>
    </>
  );
}
