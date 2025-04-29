import { IGameLog } from "@/services/gameLog.service";
import { createToaster } from "@chakra-ui/react";

export const gameLogToaster = createToaster({
  placement: "bottom-end",
  overlap: true,
  pauseOnPageIdle: true,
});

export function createGameLogToast(log: IGameLog) {
  return gameLogToaster.create({
    meta: {
      id: log.id,
      log: log,
    },
    duration: 10000,
  });
}
