import { Dialog } from "@/components/common/Dialog";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameIdOptional } from "@/hooks/useGameId";
import { ColorScheme } from "@/repositories/shared.types";
import { useGameStore } from "@/stores/game.store";
import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { ColorSchemeSelector } from "./ColorSchemeSelector";

export interface GameColorSchemeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GameColorSchemeDialog(props: GameColorSchemeDialogProps) {
  const { open, onClose } = props;
  const t = useGameTranslations();

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
    <Dialog
      open={open}
      onClose={onClose}
      title={t(
        "game.overview-sidebar.change-color-scheme",
        "Change Game Color Scheme",
      )}
      content={
        <ColorSchemeSelector
          selectedColorScheme={localColorScheme ?? ColorScheme.Default}
          onChange={setLocalColorScheme}
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
