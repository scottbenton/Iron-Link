import { useGameStore } from "stores/game.store";

import { GameType } from "repositories/game.repository";

export function useGamePermissions() {
  const gameType = useGameStore(
    (store) => store.game?.gameType ?? GameType.Solo,
  );
  const gamePermission = useGameStore((store) => store.gamePermissions);

  return {
    gameType,
    gamePermission,
  };
}
