import { getRollResultLabel } from "@/data/rollResultLabel";
import { useMove } from "@/hooks/datasworn/useMove";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import {
  ISpecialTrackProgressRoll,
  ITrackProgressRoll,
} from "@/services/gameLog.service";
import { Card } from "@chakra-ui/react";
import { ReactNode } from "react";

import { GameLogHeader } from "./GameLogHeader";
import { GameLogRollResult } from "./GameLogRollResult";
import { GameLogRollValues } from "./GameLogRollValues";

export interface GameLogTrackRollProps {
  roll: ITrackProgressRoll | ISpecialTrackProgressRoll;
  actions?: ReactNode;
}

export function GameLogTrackRoll(props: GameLogTrackRollProps) {
  const { roll, actions } = props;
  const t = useDataswornTranslations();

  const move = useMove(roll.moveId);
  const resultLabel = getRollResultLabel(roll.result);
  return (
    <>
      <GameLogHeader
        title={move ? move.name : roll.rollLabel}
        overline={move ? roll.rollLabel : undefined}
        actions={actions}
      />
      <Card.Body display="flex" flexDirection="row">
        <GameLogRollValues
          progress={roll.trackProgress}
          d10Results={[roll.challenge1, roll.challenge2]}
        />
        <GameLogRollResult
          result={resultLabel}
          extras={[
            ...(roll.challenge1 === roll.challenge2
              ? [t("datasworn.match", "Match")]
              : []),
          ]}
        />
      </Card.Body>
    </>
  );
}
