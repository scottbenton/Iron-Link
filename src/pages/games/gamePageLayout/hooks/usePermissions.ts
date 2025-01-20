import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";

import { useGameStore } from "stores/game.store";
import {
  CharacterPermissionType,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { GameType } from "repositories/game.repository";

export function useGamePermissions() {
  const characterId = useCharacterIdOptional();
  const gameType = useGameStore(
    (store) => store.game?.gameType ?? GameType.Solo,
  );
  const gamePermission = useGameStore((store) => store.gamePermissions);
  const permissionsByCharacter = useGameCharactersStore(
    (store) => store.characterPermissions,
  );

  return {
    gameType,
    gamePermission,
    permissionsByCharacter,
    characterPermission: characterId
      ? (permissionsByCharacter[characterId] ?? CharacterPermissionType.Viewer)
      : CharacterPermissionType.Viewer,
  };
}
