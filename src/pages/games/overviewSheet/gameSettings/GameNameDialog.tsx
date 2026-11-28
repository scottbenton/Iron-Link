import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";
import { TextField } from "ui/components/TextField";

import { useGameStore } from "stores/game.store";

import { useGameIdOptional } from "../../gamePageLayout/hooks/useGameId";

export interface GameNameDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Renames the game. It closes once the new name is saved. */
export function GameNameDialog(props: GameNameDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();

  const gameId = useGameIdOptional();
  const gameName = useGameStore((store) => store.game?.name);

  const [newGameName, setNewGameName] = useState(gameName ?? "");
  useEffect(() => {
    setNewGameName(gameName ?? "");
  }, [gameName]);

  const [saving, setSaving] = useState(false);
  const changeName = useGameStore((store) => store.updateGameName);
  const handleSave = () => {
    if (!gameId || saving) return;
    setSaving(true);
    changeName(gameId, newGameName)
      .then(() => onClose())
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={!!gameId && open} onClose={onClose} onSubmit={handleSave}>
      <DialogHeader
        title={t("game.overview-sidebar.change-name", "Change Game Name")}
      />
      <DialogBody>
        <TextField
          label={t("game.overview-sidebar.game-name", "Game Name")}
          value={newGameName}
          onValueChange={setNewGameName}
        />
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={saving}
          loadingLabel={t("common.saving", "Saving")}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
