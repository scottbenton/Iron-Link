import { useCallback } from "react";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { WorldCreateForm } from "pages/worlds/create/WorldCreateForm";

import { useGameStore } from "stores/game.store";

export function CreateWorldInGame() {
  const gameId = useGameId();

  const rulesets = useGameStore((store) => store.game?.rulesets ?? {});
  const expansions = useGameStore((store) => store.game?.expansions ?? {});
  const playset = useGameStore((store) => store.game?.playset ?? {});

  const addWorldToGame = useGameStore((store) => store.updateGameWorld);
  const afterWorldCreated = useCallback(
    (worldId: string) => {
      addWorldToGame(gameId, worldId)
        .then(() => {})
        .catch(() => {});
    },
    [addWorldToGame, gameId],
  );

  return (
    <WorldCreateForm
      rulesConfig={{ rulesets, expansions, playset }}
      onWorldCreated={afterWorldCreated}
      floating
    />
  );
}
