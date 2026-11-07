import CharacterSettingsIcon from "@mui/icons-material/ManageAccounts";
import { IconButton, Menu } from "@mui/material";
import { useCallback, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { CharacterMenuDialogs } from "./CharacterMenuDialogs";
import { CharacterMenuItems } from "./CharacterMenuItems";

export function CharacterSettingsMenu() {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsSettingsMenuOpen(false), []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const { t } = useTranslation();
  const canEditCharacter = useCanEditCharacter();

  if (!canEditCharacter) {
    return null;
  }

  return (
    <>
      <IconButton
        ref={buttonRef}
        aria-label={t("character.settings-menu", "Character Settings")}
        aria-haspopup="menu"
        aria-expanded={isSettingsMenuOpen ? "true" : undefined}
        aria-controls={isSettingsMenuOpen ? menuId : undefined}
        sx={{ mt: -1, mr: -1 }}
        onClick={() => setIsSettingsMenuOpen(true)}
      >
        <CharacterSettingsIcon />
      </IconButton>
      <Menu
        open={isSettingsMenuOpen}
        anchorEl={buttonRef.current}
        onClose={closeMenu}
        slotProps={{ list: { id: menuId } }}
      >
        <CharacterMenuItems closeMenu={closeMenu} />
      </Menu>
      <CharacterMenuDialogs />
    </>
  );
}
