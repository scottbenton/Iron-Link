import {
  toColorScheme,
  toThemeChoice,
} from "providers/ThemeProvider/themeChoices";

import { ThemeChange, ThemeDialog } from "ui/game/ThemeDialog";

import { useCanEditCharacter } from "pages/games/characterSheet/hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";

import { useAppThemeStore } from "stores/appTheme.store";
import { useUID } from "stores/auth.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { GameType } from "repositories/game.repository";

import { useGameIdOptional } from "../hooks/useGameId";
import { useThemeDialogCharacters } from "./useThemeDialogCharacters";

/**
 * The game page's one Theme dialog, from Change Theme in either settings
 * menu: the person's characters here, this game, and Everywhere. It opens
 * on the open character's row, else the game's.
 */
export function GameThemeDialog() {
  const open = useMenuState((state) => state.isThemeDialogOpen);
  const setOpen = useMenuState((state) => state.setIsThemeDialogOpen);

  const gameId = useGameIdOptional();
  const game = useGameStore((store) => store.game);
  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );
  const updateGameColorScheme = useGameStore(
    (store) => store.updateGameColorScheme,
  );
  const updateCharacterColorScheme = useGameCharactersStore(
    (store) => store.updateCharacterColorScheme,
  );
  const appTheme = useAppThemeStore((store) => store.appTheme);
  const setAppTheme = useAppThemeStore((store) => store.setAppTheme);
  const uid = useUID();

  const characters = useThemeDialogCharacters();
  const characterId = useCharacterIdOptional();
  const canEditCharacter = useCanEditCharacter();
  const currentCharacterId =
    characterId && canEditCharacter ? characterId : undefined;

  const solo = game?.gameType === GameType.Solo;
  // A solo game with one character shows no character row: the game holds
  // the theme. A theme that character kept from when the game had two would
  // hide the game's, so changing the game's clears it.
  const hiddenCharacterThemes =
    solo && characters.length === 1
      ? characters.filter((character) => character.theme !== null)
      : [];

  const handleSave = async (changes: ThemeChange[]) => {
    const clearHidden = changes.some(({ target }) => target.kind === "game")
      ? hiddenCharacterThemes.map((character) =>
          updateCharacterColorScheme(character.id, null),
        )
      : [];
    await Promise.all([
      ...clearHidden,
      ...changes.map(({ target, theme }) => {
        const colorScheme = toColorScheme(theme);
        if (target.kind === "character") {
          return updateCharacterColorScheme(target.id, colorScheme);
        }
        if (target.kind === "game") {
          return gameId
            ? updateGameColorScheme(gameId, colorScheme)
            : Promise.resolve();
        }
        return setAppTheme(uid, colorScheme);
      }),
    ]);
  };

  return (
    <ThemeDialog
      open={open}
      onClose={() => setOpen(false)}
      characters={characters}
      currentCharacterId={currentCharacterId}
      game={
        game
          ? {
              name: game.name,
              theme: toThemeChoice(game.colorScheme),
              canEdit: isGuide,
              solo,
            }
          : undefined
      }
      appTheme={toThemeChoice(appTheme)}
      initialOpen={
        currentCharacterId
          ? { kind: "character", id: currentCharacterId }
          : { kind: "game" }
      }
      onSave={handleSave}
    />
  );
}
