import { useCallback } from "react";
import { useNavigate } from "react-router";

import { pathConfig } from "pages/pathConfig";

import { useGameStore } from "stores/game.store";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

/**
 * Deletes the open game and goes back to the games list. Callers confirm
 * first.
 */
export function useDeleteGame() {
  const gameId = useGameIdOptional();
  const deleteGame = useGameStore((store) => store.deleteGame);
  const navigate = useNavigate();

  return useCallback(() => {
    if (!gameId) return;
    deleteGame(gameId)
      .then(() => navigate(pathConfig.gameSelect))
      .catch(() => {});
  }, [gameId, deleteGame, navigate]);
}
