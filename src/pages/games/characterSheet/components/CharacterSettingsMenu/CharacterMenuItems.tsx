import CharacterIcon from "@mui/icons-material/AccountBox";
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

import {
  CharacterPermissionType,
  useGameCharacter,
} from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { DeleteCharacterButton } from "./DeleteCharacterButton";

export interface CharacterMenuItemsProps {
  closeMenu: () => void;
}

export function CharacterMenuItems(props: CharacterMenuItemsProps) {
  const { closeMenu } = props;

  const { t } = useTranslation();

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

  if (!isCharacterOwner || !characterId) {
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
      <DeleteCharacterButton closeMenu={() => closeMenu()} />
    </>
  );
}
