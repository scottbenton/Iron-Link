import { MenuItem } from "@/components/ui/menu";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { useGameId } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { pageConfig } from "@/pages/pageConfig";
import { ConfirmFunction } from "@/providers/ConfirmProvider";
import { useGameStore } from "@/stores/game.store";
import {
  CharacterPermissionType,
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { useMenuState } from "@/stores/menuState";
import { Icon, MenuItemGroup, MenuItemGroupLabel } from "@chakra-ui/react";
import {
  CircleUserIcon,
  HashIcon,
  PaletteIcon,
  UserMinusIcon,
} from "lucide-react";
import { useCallback } from "react";
import { useLocation } from "wouter";

export interface CharacterSettingsMenuItemsProps {
  confirm: ConfirmFunction;
}

export function CharacterSettingsMenuItems(
  props: CharacterSettingsMenuItemsProps,
) {
  const { confirm } = props;

  const t = useGameTranslations();

  const isCharacterOwner =
    useGamePermissions().characterPermission === CharacterPermissionType.Owner;

  const characterId = useCharacterIdOptional();

  const characterName =
    useGameCharacter((character) => character?.name) ??
    t("common.loading", "Loading");

  const setIsCharacterDetailsDialogOpen = useMenuState(
    (store) => store.setIsCharacterDetailsDialogOpen,
  );
  const setIsCharacterStatsDialogOpen = useMenuState(
    (store) => store.setIsCharacterStatsDialogOpen,
  );
  const setIsColorSchemeDialogOpen = useMenuState(
    (store) => store.setIsColorSchemeDialogOpen,
  );

  const navigate = useLocation()[1];

  const gameId = useGameId();
  const hasMoreThanOneCharacter = useGameCharactersStore(
    (store) => Object.keys(store.characters).length > 1,
  );

  const deleteCharacter = useGameCharactersStore(
    (state) => state.deleteCharacter,
  );
  const deleteGame = useGameStore((state) => state.deleteGame);

  const handleDeleteCharacter = useCallback(() => {
    if (characterId) {
      confirm({
        title: t(
          "character.character-sidebar.delete-character",
          "Delete Character",
        ),
        message: t(
          "character.character-sidebar.delete-character-confirmation",
          "Are you sure you want to delete this character? This action cannot be undone.",
        ),
        confirmText: t("common.delete", "Delete"),
      })
        .then(({ confirmed }) => {
          if (confirmed) {
            navigate(
              hasMoreThanOneCharacter
                ? pageConfig.game(gameId)
                : pageConfig.gameSelect,
            );
            deleteCharacter(characterId);
            if (!hasMoreThanOneCharacter) {
              deleteGame(gameId).catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  }, [
    confirm,
    t,
    gameId,
    characterId,
    navigate,
    deleteCharacter,
    deleteGame,
    hasMoreThanOneCharacter,
  ]);

  if (!isCharacterOwner || !characterId) {
    return null;
  }

  return (
    <MenuItemGroup>
      <MenuItemGroupLabel>
        {t("character-settings-group-label", "{{characterName}} Settings", {
          characterName,
        })}
      </MenuItemGroupLabel>
      <MenuItem
        cursor="pointer"
        value="change-name-or-portrait"
        onClick={() => {
          setIsCharacterDetailsDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <CircleUserIcon />
        </Icon>
        {t(
          "character-settings.change-name-or-portrait",
          "Change Name or Portrait",
        )}
      </MenuItem>
      <MenuItem
        cursor="pointer"
        value="update-stats"
        onClick={() => {
          setIsCharacterStatsDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <HashIcon />
        </Icon>
        {t("character-settings.update-stats", "Update Stats")}
      </MenuItem>
      <MenuItem
        cursor="pointer"
        value="change-theme"
        onClick={() => {
          setIsColorSchemeDialogOpen(true);
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <PaletteIcon />
        </Icon>
        {t(
          "character.character-sidebar.change-theme",
          "Change Character Theme",
        )}
      </MenuItem>
      <MenuItem
        cursor="pointer"
        value="delete-character"
        onClick={() => {
          handleDeleteCharacter();
        }}
      >
        <Icon size="sm" asChild color="fg.subtle">
          <UserMinusIcon />
        </Icon>
        {t("character.character-sidebar.delete-character", "Delete Character")}
      </MenuItem>
    </MenuItemGroup>
  );
}
