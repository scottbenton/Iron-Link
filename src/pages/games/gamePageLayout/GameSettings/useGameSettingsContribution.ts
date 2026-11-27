import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { ContributedSettingsAction } from "stores/appSettingsMenu.store";
import { GamePermission, useGameStore } from "stores/game.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";
import { useMenuState } from "stores/menuState";

import { GameType } from "repositories/game.repository";

import { useDeleteCharacter } from "../../characterSheet/components/CharacterSettingsMenu/useDeleteCharacter";
import { useCanEditCharacter } from "../../characterSheet/hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../characterSheet/hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../characterSheet/hooks/useIsOwnerOfCharacter";
import { useDeleteGame } from "../../overviewSheet/gameSettings/useDeleteGame";
import { useGameIdOptional } from "../hooks/useGameId";
import { useGamePermissions } from "../hooks/usePermissions";

/**
 * The game page's part of the app's settings menu: the open character's
 * settings when the person can edit it, the game's (with Second Screen when
 * it is turned on) and the log sound. Change Theme opens the game page's
 * Theme dialog. Null until the game has loaded.
 */
export function useGameSettingsContribution() {
  const { t } = useTranslation();

  const gameId = useGameIdOptional();
  const gameName = useGameStore((store) => store.game?.name);
  const { gamePermission, gameType } = useGamePermissions();
  const characterCount = useGameCharactersStore(
    (store) => Object.keys(store.characters).length,
  );

  const characterId = useCharacterIdOptional();
  const characterName = useGameCharacter((character) => character?.name);
  const canEditCharacter = useCanEditCharacter();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const secondScreen = useSecondScreenFeature();
  const logSound = useGameLogStore((store) => store.playSoundOnLog);
  const setLogSound = useGameLogStore((store) => store.setPlaySoundOnLog);

  const menuState = useMenuState();
  const deleteCharacter = useDeleteCharacter();
  const deleteGame = useDeleteGame();

  const {
    setIsCharacterDetailsDialogOpen,
    setIsCharacterStatsDialogOpen,
    setIsCharacterEditAccessDialogOpen,
    setIsThemeDialogOpen,
    setIsGameNameDialogOpen,
    setIsRulesetDialogOpen,
    setIsSecondScreenDialogOpen,
  } = menuState;

  return useMemo(() => {
    if (!gameId || gameName === undefined) return null;

    const isGuide = gamePermission === GamePermission.Guide;
    const editsCharacter = !!characterId && canEditCharacter;

    const onSelect = (action: ContributedSettingsAction) => {
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
        case "gameName":
          setIsGameNameDialogOpen(true);
          break;
        case "gameRulesets":
          setIsRulesetDialogOpen(true);
          break;
        case "secondScreen":
          setIsSecondScreenDialogOpen(true);
          break;
        case "theme":
          setIsThemeDialogOpen(true);
          break;
      }
    };

    return {
      game: {
        name: gameName,
        isGuide,
        solo: gameType === GameType.Solo,
        characterCount,
        secondScreen,
      },
      character: editsCharacter
        ? {
            name: characterName ?? t("common.loading", "Loading"),
            isOwner: isCharacterOwner,
          }
        : undefined,
      logSound,
      onLogSoundChange: setLogSound,
      onSelect,
      onDeleteCharacter: deleteCharacter,
      onDeleteGame: deleteGame,
    };
  }, [
    t,
    gameId,
    gameName,
    gamePermission,
    gameType,
    characterCount,
    secondScreen,
    characterId,
    characterName,
    canEditCharacter,
    isCharacterOwner,
    logSound,
    setLogSound,
    deleteCharacter,
    deleteGame,
    setIsCharacterDetailsDialogOpen,
    setIsCharacterStatsDialogOpen,
    setIsCharacterEditAccessDialogOpen,
    setIsThemeDialogOpen,
    setIsGameNameDialogOpen,
    setIsRulesetDialogOpen,
    setIsSecondScreenDialogOpen,
  ]);
}
