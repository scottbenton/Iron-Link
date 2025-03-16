import { Dialog } from "@/components/common/Dialog";
import { TextField } from "@/components/common/TextField";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameIdOptional } from "@/hooks/useGameId";
import { useGameStore } from "@/stores/game.store";
import { Button } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

export interface GameNameDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameNameDialog(props: GameNameDialogProps) {
  const { open, onClose } = props;
  const t = useGameTranslations();

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
        .catch(() => {});
      onClose();
    }
  }, [newGameName, changeName, onClose, gameId]);

  return (
    <Dialog
      open={!!gameId && open}
      onClose={onClose}
      title={t("game.overview-sidebar.change-name", "Change Game Name")}
      content={
        <TextField
          label={t("game.overview-sidebar.game-name", "Game Name")}
          value={newGameName}
          onChange={(value) => setNewGameName(value)}
        />
      }
      actions={
        <>
          <Button colorPalette="gray" variant="ghost" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave}>
            {t("common.save-changes", "Save Changes")}
          </Button>
        </>
      }
    />
  );
}
