import { RollType } from "@/repositories/shared.types";
import { IGameLog } from "@/services/gameLog.service";
import { Card, CardRootProps, Theme } from "@chakra-ui/react";
import { ForwardedRef, ReactNode } from "react";

import { GameLogOracleRoll } from "./GameLogOracleRoll";
import { GameLogStatRoll } from "./GameLogStatRoll";
import { GameLogTrackRoll } from "./GameLogTrackRoll";

interface GameLogCardProps extends Omit<CardRootProps, "children"> {
  log: IGameLog;
  actions?: ReactNode;
  ref?: ForwardedRef<HTMLDivElement>;
}

export function GameLogCard(props: GameLogCardProps) {
  const { log, ref, actions, ...cardRootProps } = props;

  return (
    <Theme appearance={"dark"} hasBackground={false} asChild>
      <Card.Root size="sm" variant="subtle" {...cardRootProps} ref={ref}>
        {log.type === RollType.Stat && (
          <GameLogStatRoll roll={log} actions={actions} />
        )}
        {log.type === RollType.OracleTable && (
          <GameLogOracleRoll roll={log} actions={actions} />
        )}
        {(log.type === RollType.TrackProgress ||
          log.type === RollType.SpecialTrackProgress) && (
          <GameLogTrackRoll roll={log} actions={actions} />
        )}
      </Card.Root>
    </Theme>
  );
}
