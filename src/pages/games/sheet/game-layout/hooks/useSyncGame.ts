import { useGameIdOptional } from "@/hooks/useGameId";
import { useListenToGameAssets } from "@/stores/assets.store";
import { useListenToGame } from "@/stores/game.store";
import { useListenToGameCharacters } from "@/stores/gameCharacters.store";
import { useListenToGameLogs } from "@/stores/gameLog.store";
import { useListenToGameNotes } from "@/stores/notes.store";
import { useListenToTracks } from "@/stores/tracks.store";

export function useSyncGame() {
  const gameId = useGameIdOptional();

  useListenToGame(gameId);
  useListenToGameCharacters(gameId);
  useListenToGameAssets(gameId);
  useListenToTracks(gameId);
  useListenToGameLogs(gameId);
  useListenToGameNotes(gameId);
}
