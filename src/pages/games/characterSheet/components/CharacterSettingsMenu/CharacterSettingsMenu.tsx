import CharacterSettingsIcon from "@mui/icons-material/ManageAccounts";
import { IconButton, Menu } from "@mui/material";
import { useCallback, useRef, useState } from "react";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { CharacterMenuDialogs } from "./CharacterMenuDialogs";
import { CharacterMenuItems } from "./CharacterMenuItems";

export function CharacterSettingsMenu() {
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsSettingsMenuOpen(false), []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const canEditCharacter = useCanEditCharacter();

  if (!canEditCharacter) {
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
