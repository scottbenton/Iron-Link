import { useEffect } from "react";

import { useAppState } from "stores/appState.store";
import { useListenToGameAssets } from "stores/assets.store";
import { useListenToGame } from "stores/game.store";
import { useListenToGameCharacters } from "stores/gameCharacters.store";
import { useListenToGameLogs } from "stores/gameLog.store";
import { useListenToGameNotes } from "stores/notes.store";
import { useListenToTracks } from "stores/tracks.store";

import { useGameIdOptional } from "./useGameId";

export function useSyncGame() {
  const gameId = useGameIdOptional();

  const resetReference = useAppState((state) => state.resetReference);

  useEffect(() => {
    resetReference();
  }, [resetReference]);

  useListenToGame(gameId);
  useListenToGameCharacters(gameId);
  useListenToGameAssets(gameId);
  useListenToTracks(gameId);
  useListenToGameLogs(gameId);
  useListenToGameNotes(gameId);
}
