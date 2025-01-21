import GameSettingsIcon from "@mui/icons-material/Settings";
import { IconButton, Menu, Tooltip } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { GamePermission } from "stores/game.store";

import { useGamePermissions } from "../../gamePageLayout/hooks/usePermissions";
import { GameSettingsMenuDialogs } from "./GameSettingsMenuDialogs";
import { GameSettingsMenuItems } from "./GameSettingsMenuItems";

export function GameSettingsMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const { t } = useTranslation();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const { gamePermission } = useGamePermissions();

  if (gamePermission !== GamePermission.Guide) {
    return null;
  }

  return (
    <>
      <Tooltip title={t("game.game-settings", "Game Settings")}>
        <IconButton
          onClick={() => setIsMenuOpen(true)}
          ref={buttonRef}
          sx={{ mt: -1, mr: -1 }}
        >
          <GameSettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu open={isMenuOpen} onClose={closeMenu} anchorEl={buttonRef.current}>
        <GameSettingsMenuItems closeMenu={closeMenu} />
      </Menu>
      <GameSettingsMenuDialogs />
    </>
  );
}
