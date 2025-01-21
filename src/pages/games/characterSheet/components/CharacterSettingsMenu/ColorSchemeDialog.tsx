import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ColorSchemeSelector } from "components/ColorSchemeSelector";
import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { ColorScheme } from "repositories/shared.types";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";

export interface ColorSchemeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ColorSchemeDialog(props: ColorSchemeDialogProps) {
  const { open, onClose } = props;
  const { t } = useTranslation();

  const characterId = useCharacterIdOptional();
  const colorScheme = useGameCharacter((character) => character?.colorScheme);
  const updateColorScheme = useGameCharactersStore(
    (store) => store.updateCharacterColorScheme,
  );

  const [localColorScheme, setLocalColorScheme] = useState(colorScheme);
  useEffect(() => {
    setLocalColorScheme(colorScheme);
  }, [colorScheme]);

  const handleSave = () => {
    if (characterId) {
      updateColorScheme(characterId, localColorScheme || null).catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t(
          "character.character-sidebar.change-color-scheme",
          "Change Color Scheme",
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
