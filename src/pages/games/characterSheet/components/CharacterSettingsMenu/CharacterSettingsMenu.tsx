import {
  CharacterSettingsMenu as LibraryCharacterSettingsMenu,
  SettingsMenuAction,
} from "ui/layout";

import { GamePermission, useGameStore } from "stores/game.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { GameType } from "repositories/game.repository";

import { useGamePermissions } from "../../../gamePageLayout/hooks/usePermissions";
import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";
import { useDeleteCharacter } from "./useDeleteCharacter";

/**
 * The gear beside the character's name: that character's own settings. Its
 * dialogs, the Theme dialog included, are mounted once for the game page by
 * `GameSettings`.
 */
export function CharacterSettingsMenu() {
  const canEditCharacter = useCanEditCharacter();
  const isOwner = useIsOwnerOfCharacter();
  const name = useGameCharacter((character) => character?.name ?? "");
  const gameName = useGameStore((store) => store.game?.name);
  const { gamePermission, gameType } = useGamePermissions();
  const characterCount = useGameCharactersStore(
    (store) => Object.keys(store.characters).length,
  );
  const deleteCharacter = useDeleteCharacter();

  const {
    setIsCharacterDetailsDialogOpen,
    setIsCharacterStatsDialogOpen,
    setIsCharacterEditAccessDialogOpen,
    setIsThemeDialogOpen,
  } = useMenuState();

  if (!canEditCharacter) {
    return null;
  }

  const handleSelect = (action: SettingsMenuAction) => {
    switch (action) {
      case "characterDetails":
        setIsCharacterDetailsDialogOpen(true);
        break;
      case "characterStats":
        setIsCharacterStatsDialogOpen(true);
        break;
      case "characterAccess":
        setIsCharacterEditAccessDialogOpen(true);
        break;
      case "theme":
        setIsThemeDialogOpen(true);
        break;
    }
  };

  return (
    <LibraryCharacterSettingsMenu
      character={{ name, isOwner }}
      game={
        gameName === undefined
          ? undefined
          : {
              name: gameName,
              isGuide: gamePermission === GamePermission.Guide,
              solo: gameType === GameType.Solo,
              characterCount,
            }
      }
      onSelect={handleSelect}
      onDeleteCharacter={deleteCharacter}
    />
  );
}
