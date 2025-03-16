import { MenuItem, MenuItemGroup } from "@/components/ui/menu";
import { useSecondScreenFeature } from "@/hooks/advancedFeatures/useSecondScreenFeature";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameIdOptional } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { pageConfig } from "@/pages/pageConfig";
import { ConfirmFunction } from "@/providers/ConfirmProvider";
import { GamePermission, useGameStore } from "@/stores/game.store";
import { useMenuState } from "@/stores/menuState";
import { useSecondScreenStore } from "@/stores/secondScreen.store";
import { Icon, MenuItemGroupLabel } from "@chakra-ui/react";
import {
  EditIcon,
  ListTreeIcon,
  MonitorIcon,
  PaletteIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback } from "react";
import { useLocation } from "wouter";

export interface GameSettingsMenuItemsProps {
  confirm: ConfirmFunction;
}

export function GameSettingsMenuItems(props: GameSettingsMenuItemsProps) {
  const { confirm } = props;
  const t = useGameTranslations();

  const setIsGameNameDialogOpen = useMenuState(
    (state) => state.setIsGameNameDialogOpen,
  );
  const setIsRulesetDialogOpen = useMenuState(
    (state) => state.setIsRulesetDialogOpen,
  );
  const setIsGameThemeDialogOpen = useMenuState(
    (state) => state.setIsGameThemeDialogOpen,
  );

  const { gamePermission } = useGamePermissions();

  const deleteGame = useGameStore((store) => store.deleteGame);
  const gameId = useGameIdOptional();

  const navigate = useLocation()[1];

  const isSecondScreenOn = useSecondScreenFeature();
  const areAllCharactersVisible = useSecondScreenStore(
    (store) => store.areAllCharactersVisible,
  );
  const setAreAllCharactersVisible = useSecondScreenStore(
    (store) => store.setAreAllCharactersVisible,
  );

  const updateAreAllCharactersVisible = useCallback(() => {
    if (gameId) {
      setAreAllCharactersVisible(gameId, !areAllCharactersVisible);
    }
  }, [gameId, areAllCharactersVisible, setAreAllCharactersVisible]);

  const confirmDeleteGame = useCallback(() => {
    if (gameId) {
      confirm({
        title: t(
          "game.overview-sidebar.delete-game-confirm-title",
          "Delete Game?",
        ),
        message: t(
          "game.overview-sidebar.delete-game-confirm-description",
          "Are you sure you want to delete this game? This action cannot be undone.",
        ),
        confirmText: t("common.delete", "Delete"),
        confirmColorPalette: "red",
      })
        .then(({ confirmed }) => {
          if (confirmed) {
            deleteGame(gameId)
              .then(() => {
                navigate(pageConfig.gameSelect);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [confirm, gameId, deleteGame, t, navigate]);

  if (!gameId || gamePermission !== GamePermission.Guide) {
    return null;
  }

  return (
    <MenuItemGroup>
      <MenuItemGroupLabel>
        {t("game.game-settings", "Game Settings")}
      </MenuItemGroupLabel>
      <MenuItem
        cursor="pointer"
        value="change-game-name"
        onClick={() => {
          setIsGameNameDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <EditIcon />
        </Icon>
        {t("game-settings.edit-game-name", "Edit Game Name")}
      </MenuItem>
      <MenuItem
        cursor="pointer"
        value="change-ruleset"
        onClick={() => {
          setIsRulesetDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <ListTreeIcon />
        </Icon>
        {t("game-settings.change-ruleset", "Edit Rulesets")}
      </MenuItem>
      <MenuItem
        cursor="pointer"
        value="change-game-theme"
        onClick={() => {
          setIsGameThemeDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <PaletteIcon />
        </Icon>
        {t("game-settings.change-game-theme", "Change Game Theme")}
      </MenuItem>
      {isSecondScreenOn && (
        <MenuItem
          cursor="pointer"
          value="toggle-second-screen-character-sidebar"
          onClick={updateAreAllCharactersVisible}
        >
          <Icon size="sm" asChild color="fg.subtle">
            <MonitorIcon />
          </Icon>
          {areAllCharactersVisible
            ? t(
                "game-settings.hide-all-characters-second-screen",
                "Hide All Characters on Second Screen",
              )
            : t(
                "game-settings.show-all-characters-second-screen",
                "Show All Characters on Second Screen",
              )}
        </MenuItem>
      )}
      <MenuItem
        cursor="pointer"
        value="delete-game"
        onClick={confirmDeleteGame}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <TrashIcon />
        </Icon>

        {t("game-settings.delete-game", "Delete Game")}
      </MenuItem>
    </MenuItemGroup>
  );
}
