import { Alert, Box } from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { GradientButton } from "components/GradientButton";

import { pathConfig } from "pages/pathConfig";

import { useUID } from "stores/auth.store";
import { useCreateCharacterStore } from "stores/createCharacter.store";

import { CreateCharacter } from "../create/components/CreateCharacter";
import { useGameId } from "../gamePageLayout/hooks/useGameId";

export default function AddCharacter() {
  const gameId = useGameId();
  const { t } = useTranslation();

  const [error, setError] = useState<string | undefined>(undefined);

  const uid = useUID();

  const createCharacter = useCreateCharacterStore(
    (store) => store.createCharacter,
  );
  const resetCharacter = useCreateCharacterStore((store) => store.reset);
  const navigate = useNavigate();

  const handleCreate = useCallback(() => {
    if (!uid) return;

    createCharacter(gameId, uid)
      .then((characterId) => {
        resetCharacter();
        navigate(pathConfig.gameCharacter(gameId, characterId));
      })
      .catch(() => {
        setError(
          t("character.error-creating-character", "Error creating character"),
        );
      });
  }, [uid, t, navigate, gameId, createCharacter, resetCharacter]);

  if (!uid) {
    return null;
  }

  return (
    <>
      {error && (
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      )}
      <CreateCharacter />
      <Box mt={4} display="flex" justifyContent={"flex-end"}>
        <GradientButton onClick={handleCreate}>
          {t("character.add-character", "Add Character")}
        </GradientButton>
      </Box>
    </>
  );
}
