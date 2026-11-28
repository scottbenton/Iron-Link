import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import { HStack, Stack } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";
import { useCreateCharacterStore } from "stores/createCharacter.store";

import { CreateCharacterStep } from "../create/components/CreateCharacterStep";
import { useGameId } from "../gamePageLayout/hooks/useGameId";

/** Adds a character to a game that already exists, then opens its sheet. */
export default function AddCharacter() {
  const gameId = useGameId();
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.GameCharacterCreate);

  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const uid = useUID();

  const createCharacter = useCreateCharacterStore(
    (store) => store.createCharacter,
  );
  const resetCharacter = useCreateCharacterStore((store) => store.reset);
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!uid || loading) return;
    setLoading(true);
    setFailed(false);
    createCharacter(gameId, uid)
      .then((characterId) => {
        resetCharacter();
        navigate(pathConfig.gameCharacter(gameId, characterId));
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  };

  if (!uid) {
    return null;
  }

  return (
    <Stack gap="6">
      {failed && (
        <Alert tone="danger">
          {t("character.error-creating-character", "Error creating character")}
        </Alert>
      )}
      <CreateCharacterStep />
      <HStack justifyContent="flex-end">
        <Button
          variant="gradient"
          loading={loading}
          loadingLabel={t("character.adding-character", "Adding Character")}
          onClick={handleCreate}
        >
          {t("character.add-character", "Add Character")}
        </Button>
      </HStack>
    </Stack>
  );
}
