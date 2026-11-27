import DeleteIcon from "@mui/icons-material/Delete";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "ui/components/ConfirmDialog";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useDeleteCharacter } from "./useDeleteCharacter";

export interface DeleteCharacterButtonProps {
  closeMenu: () => void;
}

export function DeleteCharacterButton(props: DeleteCharacterButtonProps) {
  const { closeMenu } = props;

  const { t } = useTranslation();

  const characterId = useCharacterIdOptional();
  const deleteCharacter = useDeleteCharacter();

  const confirm = useConfirm();
  const handleDeleteCharacter = useCallback(() => {
    if (characterId) {
      confirm({
        title: t(
          "character.character-sidebar.delete-character",
          "Delete Character",
        ),
        description: t(
          "character.character-sidebar.delete-character-confirmation",
          "Are you sure you want to delete this character? This action cannot be undone.",
        ),
        confirmationText: t("common.delete", "Delete"),
      })
        .then(({ confirmed }) => {
          closeMenu();
          if (confirmed) deleteCharacter();
        })
        .catch(() => {
          closeMenu();
        });
    }
  }, [confirm, t, characterId, closeMenu, deleteCharacter]);

  return (
    <MenuItem
      onClick={() => {
        handleDeleteCharacter();
      }}
    >
      <ListItemIcon>
        <DeleteIcon />
      </ListItemIcon>
      <ListItemText
        primary={t(
          "character.character-sidebar.delete-character",
          "Delete Character",
        )}
      />
    </MenuItem>
  );
}
