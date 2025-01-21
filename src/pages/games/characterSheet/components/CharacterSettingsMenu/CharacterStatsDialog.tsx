import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { ConditionMeter } from "components/datasworn/ConditonMeter";

import { useStatRules } from "stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";

export interface CharacterStatsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterStatsDialog(props: CharacterStatsDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();

  const characterId = useCharacterIdOptional();
  const stats = useGameCharacter((character) => character?.stats ?? {});
  const updateCharacterStats = useGameCharactersStore(
    (store) => store.updateCharacterStats,
  );
  const statRules = useStatRules();

  const [localStatValues, setLocalStatValues] = useState({ ...stats });
  useEffect(() => {
    setLocalStatValues({ ...stats });
  }, [stats]);

  const handleSave = () => {
    if (characterId) {
      updateCharacterStats(characterId, localStatValues).catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("character.character-sidebar.update-stats", "Update Stats")}
      </DialogTitleWithCloseButton>
      <DialogContent sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {Object.entries(statRules).map(([statKey, statRule]) => (
          <ConditionMeter
            key={statKey}
            label={statRule.label}
            defaultValue={0}
            value={localStatValues[statKey]}
            onChange={(value) => {
              setLocalStatValues((prev) => ({
                ...prev,
                [statKey]: value,
              }));
            }}
            min={-9}
            max={9}
          />
        ))}
        {/* Add your stat updating components here */}
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
