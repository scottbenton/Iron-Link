import { useCallback } from "react";
import { useNavigate } from "react-router";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { pathConfig } from "pages/pathConfig";

import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";

/**
 * Deletes the open character and leaves its page. A game's last character
 * takes the game with it. Callers confirm first.
 */
export function useDeleteCharacter() {
  const navigate = useNavigate();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const hasMoreThanOneCharacter = useGameCharactersStore(
    (store) => Object.keys(store.characters).length > 1,
  );
  const deleteCharacter = useGameCharactersStore(
    (state) => state.deleteCharacter,
  );
  const deleteGame = useGameStore((state) => state.deleteGame);

  return useCallback(() => {
    if (!characterId) return;
    navigate(
      hasMoreThanOneCharacter ? pathConfig.game(gameId) : pathConfig.gameSelect,
    );
    deleteCharacter(characterId);
    if (!hasMoreThanOneCharacter) {
      deleteGame(gameId).catch(() => {});
    }
  }, [
    characterId,
    navigate,
    hasMoreThanOneCharacter,
    gameId,
    deleteCharacter,
    deleteGame,
  ]);
}
