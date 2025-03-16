import { Dialog } from "@/components/common/Dialog";
import { ConditionMeter } from "@/components/datasworn/ConditonMeter";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { useStatRules } from "@/stores/dataswornTree.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export interface CharacterStatsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterStatsDialog(props: CharacterStatsDialogProps) {
  const { open, onClose } = props;

  const t = useGameTranslations();

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
    <Dialog
      open={open}
      onClose={onClose}
      title={t("character.character-sidebar.update-stats", "Update Stats")}
      content={
        <Box display="flex" flexWrap="wrap" gap={2}>
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
        </Box>
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
