import {
  useCharacterIdOptional,
  useSetCharacterId,
} from "@/hooks/useCharacterId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { GameType } from "@/repositories/game.repository";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { useEffect } from "react";

export function HandleSoloGameRedirect() {
  const { gameType } = useGamePermissions();
  const characters = useGameCharactersStore((store) =>
    Object.values(store.characters),
  );

  const characterId = useCharacterIdOptional();
  const setCharacterId = useSetCharacterId();

  const hasOneCharacter = characters.length === 1;
  const initialCharacterId = characters[0]?.id;

  useEffect(() => {
    if (gameType === GameType.Solo && hasOneCharacter && initialCharacterId) {
      setCharacterId(initialCharacterId);
    }
  }, [
    initialCharacterId,
    hasOneCharacter,
    characterId,
    gameType,
    setCharacterId,
  ]);

  return null;
}
