import CharacterSettingsIcon from "@mui/icons-material/ManageAccounts";
import { IconButton, Menu } from "@mui/material";
import { useCallback, useRef, useState } from "react";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { CharacterPermissionType } from "stores/gameCharacters.store";

import { CharacterMenuDialogs } from "./CharacterMenuDialogs";
import { CharacterMenuItems } from "./CharacterMenuItems";

export function CharacterSettingsMenu() {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsSettingsMenuOpen(false), []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const isCharacterOwner =
    useGamePermissions().characterPermission === CharacterPermissionType.Owner;

  if (!isCharacterOwner) {
    return null;
  }

  return (
    <>
      <IconButton
        ref={buttonRef}
        sx={{ mt: -1, mr: -1 }}
        onClick={() => setIsSettingsMenuOpen(true)}
      >
        <CharacterSettingsIcon />
      </IconButton>
      <Menu
        open={isSettingsMenuOpen}
        anchorEl={buttonRef.current}
        onClose={closeMenu}
      >
        <CharacterMenuItems closeMenu={closeMenu} />
      </Menu>
      <CharacterMenuDialogs />
    </>
  );
}
