import { Dialog } from "@/components/common/Dialog";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { ColorScheme } from "@/repositories/shared.types";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { ColorSchemeSelector } from "./ColorSchemeSelector";

export interface CharacterColorSchemeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterColorSchemeDialog(
  props: CharacterColorSchemeDialogProps,
) {
  const { open, onClose } = props;
  const t = useGameTranslations();

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
    <Dialog
      open={open}
      onClose={onClose}
      title={t(
        "character.character-sidebar.change-color-scheme",
        "Change Color Scheme",
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
