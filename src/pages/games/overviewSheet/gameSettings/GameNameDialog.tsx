import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGameStore } from "stores/game.store";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

export interface GameNameDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameNameDialog(props: GameNameDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();
  const { error } = useSnackbar();

  const gameId = useGameIdOptional();
  const gameName = useGameStore((store) => store.game?.name);

  const [newGameName, setNewGameName] = useState(gameName ?? "");
  useEffect(() => {
    setNewGameName(gameName ?? "");
  }, [gameName]);

  const changeName = useGameStore((store) => store.updateGameName);
  const handleSave = useCallback(() => {
    if (gameId) {
      changeName(gameId, newGameName)
        .then(() => {
          onClose();
        })
        .catch(() => {
          error(
            t(
              "game.overview-sidebar.change-name-error",
              "Failed to change game name",
            ),
          );
        });
      onClose();
    }
  }, [newGameName, changeName, onClose, error, gameId, t]);

  return (
    <Dialog open={!!gameId && open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("game.overview-sidebar.change-name", "Change Game Name")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <TextField
          label={t("game.overview-sidebar.game-name", "Game Name")}
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="contained" onClick={handleSave}>
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
