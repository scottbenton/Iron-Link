import { RollType } from "@/repositories/shared.types";
import { IGameLog } from "@/services/gameLog.service";
import { Card, CardRootProps, Theme } from "@chakra-ui/react";

import { GameLogOracleRoll } from "./GameLogOracleRoll";
import { GameLogStatRoll } from "./GameLogStatRoll";
import { GameLogTrackRoll } from "./GameLogTrackRoll";

interface GameLogCardProps extends Omit<CardRootProps, "children"> {
  log: IGameLog;
}

export function GameLogCard(props: GameLogCardProps) {
  const { log, ...cardRootProps } = props;

  return (
    <Theme appearance={"dark"} hasBackground={false}>
      <Card.Root size="sm" variant="subtle" {...cardRootProps}>
        {log.type === RollType.Stat && <GameLogStatRoll roll={log} />}
        {log.type === RollType.OracleTable && <GameLogOracleRoll roll={log} />}
        {(log.type === RollType.TrackProgress ||
          log.type === RollType.SpecialTrackProgress) && (
          <GameLogTrackRoll roll={log} />
        )}
      </Card.Root>
    </Theme>
  );
}
