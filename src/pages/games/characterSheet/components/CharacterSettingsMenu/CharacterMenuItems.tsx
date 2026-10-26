import CharacterIcon from "@mui/icons-material/AccountBox";
import EditAccessIcon from "@mui/icons-material/Group";
import StatsIcon from "@mui/icons-material/Numbers";
import ThemeIcon from "@mui/icons-material/Palette";
import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useGameCharacter } from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { GameType } from "repositories/game.repository";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";
import { DeleteCharacterButton } from "./DeleteCharacterButton";

export interface CharacterMenuItemsProps {
  closeMenu: () => void;
}

export function CharacterMenuItems(props: CharacterMenuItemsProps) {
  const { closeMenu } = props;

  const { t } = useTranslation();

  const canEditCharacter = useCanEditCharacter();
  const isCharacterOwner = useIsOwnerOfCharacter();
  const { gameType } = useGamePermissions();

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
  const setIsCharacterEditAccessDialogOpen = useMenuState(
    (store) => store.setIsCharacterEditAccessDialogOpen,
  );

  if (!canEditCharacter || !characterId) {
    return null;
  }

  return (
    <>
      <ListSubheader>
        {t("character.character-settings", "{{characterName}} Settings", {
          characterName,
        })}
      </ListSubheader>
      <MenuItem
        onClick={() => {
          setIsCharacterDetailsDialogOpen(true);
          closeMenu();
        }}
      >
        <ListItemIcon>
          <CharacterIcon />
        </ListItemIcon>
        <ListItemText
          primary={t(
            "character.character-sidebar.change-name-or-portrait",
            "Change Name or Portrait",
          )}
        />
      </MenuItem>
      <MenuItem
        onClick={() => {
          setIsCharacterStatsDialogOpen(true);
          closeMenu();
        }}
      >
        <ListItemIcon>
          <StatsIcon />
        </ListItemIcon>
        <ListItemText
          primary={t(
            "character.character-sidebar.update-stats",
            "Update Stats",
          )}
        />
      </MenuItem>
      <MenuItem
        onClick={() => {
          setIsColorSchemeDialogOpen(true);
          closeMenu();
        }}
      >
        <ListItemIcon>
          <ThemeIcon />
        </ListItemIcon>
        <ListItemText
          primary={t(
            "character.character-sidebar.change-theme",
            "Change Theme",
          )}
        />
      </MenuItem>
      {isCharacterOwner && gameType !== GameType.Solo && (
        <MenuItem
          onClick={() => {
            setIsCharacterEditAccessDialogOpen(true);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditAccessIcon />
          </ListItemIcon>
          <ListItemText
            primary={t("character.edit-access.title", "Edit Access")}
          />
        </MenuItem>
      )}
      {isCharacterOwner && (
        <DeleteCharacterButton closeMenu={() => closeMenu()} />
      )}
    </>
  );
}
