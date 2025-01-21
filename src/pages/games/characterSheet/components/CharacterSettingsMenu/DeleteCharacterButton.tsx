import DeleteIcon from "@mui/icons-material/Delete";
import { ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { pathConfig } from "pages/pathConfig";

import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";

export interface DeleteCharacterButtonProps {
  closeMenu: () => void;
}

export function DeleteCharacterButton(props: DeleteCharacterButtonProps) {
  const { closeMenu } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const gameId = useGameId();
  const characterId = useCharacterIdOptional();
  const hasMoreThanOneCharacter = useGameCharactersStore(
    (store) => Object.keys(store.characters).length > 1,
  );

  const deleteCharacter = useGameCharactersStore(
    (state) => state.deleteCharacter,
  );
  const deleteGame = useGameStore((state) => state.deleteGame);

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
        .then(() => {
          closeMenu();
          navigate(
            hasMoreThanOneCharacter
              ? pathConfig.game(gameId)
              : pathConfig.gameSelect,
          );
          deleteCharacter(characterId);
          if (!hasMoreThanOneCharacter) {
            deleteGame(gameId).catch(() => {});
          }
        })
        .catch(() => {
          closeMenu();
        });
    }
  }, [
    confirm,
    t,
    gameId,
    characterId,
    navigate,
    closeMenu,
    deleteCharacter,
    deleteGame,
    hasMoreThanOneCharacter,
  ]);

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
