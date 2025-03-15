import {
  useCharacterIdOptional,
  useSetCharacterId,
} from "@/hooks/useCharacterId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { GameType } from "@/repositories/game.repository";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";

export function HandleSoloGameRedirect() {
  const { gameType } = useGamePermissions();
  const characters = useGameCharactersStore((store) =>
    Object.values(store.characters),
  );

  const characterId = useCharacterIdOptional();
  const setCharacterId = useSetCharacterId();

  if (gameType === GameType.Solo && characters.length === 1 && !characterId) {
    setCharacterId(characters[0].id);
  }
  return null;
}
