import { IGameLog } from "@/services/gameLog.service";
import { useGameLogStore } from "@/stores/gameLog.store";
import { CardRootProps } from "@chakra-ui/react";
import { ForwardedRef } from "react";

import { GameLogCard } from "../GameLog/GameLogCard";

export interface GameLogToastProps extends Omit<CardRootProps, "children"> {
  logId: string;
  initialLog: IGameLog;
  ref?: ForwardedRef<HTMLDivElement>;
}
export function GameLogToast(props: GameLogToastProps) {
  const { logId, initialLog, ref, ...cardProps } = props;
  const log = useGameLogStore((store) => store.logs[logId] ?? initialLog);

  return <GameLogCard ref={ref} log={log} {...cardProps} />;
}
