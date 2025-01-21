import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ColorSchemeSelector } from "components/ColorSchemeSelector";
import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGameStore } from "stores/game.store";

import { ColorScheme } from "repositories/shared.types";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

export interface GameColorSchemeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameColorSchemeDialog(props: GameColorSchemeDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();

  const gameId = useGameIdOptional();
  const colorScheme = useGameStore((store) => store.game?.colorScheme);
  const updateColorScheme = useGameStore(
    (store) => store.updateGameColorScheme,
  );

  const [localColorScheme, setLocalColorScheme] = useState(colorScheme);
  useEffect(() => {
    setLocalColorScheme(colorScheme);
  }, [colorScheme]);

  const handleSave = () => {
    if (gameId) {
      updateColorScheme(gameId, localColorScheme || null).catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t(
          "game.overview-sidebar.change-color-scheme",
          "Change Game Color Scheme",
        )}
      </DialogTitleWithCloseButton>
      <DialogContent>
        {/* Add your color scheme selection UI here */}
        <ColorSchemeSelector
          selectedColorScheme={localColorScheme ?? ColorScheme.Default}
          onChange={setLocalColorScheme}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave}>
          {t("common.save-changes", "Save Changes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
