import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import {
  getDisplayedEditPermissions,
  getEditPermissionOptions,
} from "stores/characterAccess";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store";

import { CharacterEditPermissions } from "repositories/character.repository";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter";

export interface CharacterEditAccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CharacterEditAccessDialog(
  props: CharacterEditAccessDialogProps,
) {
  const { open, onClose } = props;

  const { t } = useTranslation();
  const labelId = useId();

  const characterId = useCharacterIdOptional();
  const isOwner = useIsOwnerOfCharacter();
  const { gameType } = useGamePermissions();

  const currentEditPermissions = useGameCharacter((character) =>
    character
      ? getDisplayedEditPermissions(character.editPermissions, gameType)
      : CharacterEditPermissions.OnlyOwner,
  );
  const updateEditPermissions = useGameCharactersStore(
    (store) => store.updateCharacterEditPermissions,
  );

  const [editPermissions, setEditPermissions] = useState(
    currentEditPermissions,
  );
  useEffect(() => {
    if (open) {
      setEditPermissions(currentEditPermissions);
    }
  }, [currentEditPermissions, open]);

  const options = getEditPermissionOptions(gameType);
  if (!isOwner || options.length === 0) {
    return null;
  }

  const labels: Record<CharacterEditPermissions, string> = {
    [CharacterEditPermissions.OnlyOwner]: t(
      "character.edit-access.only-owner",
      "Only Me",
    ),
    [CharacterEditPermissions.GuidesAndOwner]: t(
      "character.edit-access.guides-and-owner",
      "Me and the Guides",
    ),
    [CharacterEditPermissions.AllPlayers]: t(
      "character.edit-access.all-players",
      "All Players",
    ),
  };

  const handleSave = () => {
    onClose();
    if (characterId && editPermissions !== currentEditPermissions) {
      updateEditPermissions(characterId, editPermissions).catch(() => {});
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("character.edit-access.title", "Edit Access")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <FormControl>
          <FormLabel id={labelId}>
            {t("character.edit-access.label", "Who can edit this sheet?")}
          </FormLabel>
          <RadioGroup
            aria-labelledby={labelId}
            value={editPermissions}
            onChange={(_, value) =>
              setEditPermissions(value as CharacterEditPermissions)
            }
          >
            {options.map((option) => (
              <FormControlLabel
                key={option}
                value={option}
                control={<Radio />}
                label={labels[option]}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {t("common.save-changes", "Save Changes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
