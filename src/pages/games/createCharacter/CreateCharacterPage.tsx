import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { useGameId } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { useUID } from "@/stores/auth.store";
import { useCreateCharacterStore } from "@/stores/createCharacter.store";
import { GamePermission } from "@/stores/game.store";
import { Alert, Button, Group } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

import { CreateCharacter } from "../shared/CreateCharacter";

export default function CreateCharacterPage() {
  const t = useCharacterCreateTranslations();

  const uid = useUID();
  const gameId = useGameId();
  const { gamePermission } = useGamePermissions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createCharacter = useCreateCharacterStore(
    (store) => store.createCharacter,
  );
  const resetCharacter = useCreateCharacterStore((store) => store.reset);
  const navigate = useLocation()[1];

  const handleCreate = useCallback(() => {
    if (!uid) return;

    setLoading(true);

    createCharacter(gameId, uid)
      .then((characterId) => {
        resetCharacter();
        navigate(`/c/${characterId}`);
      })
      .catch(() => {
        setError(t("error-creating-character", "Error creating character"));
        setLoading(false);
      });
  }, [uid, t, navigate, gameId, createCharacter, resetCharacter]);

  if (gamePermission === GamePermission.Viewer) {
    return <></>;
  }

  return (
    <>
      <PageHeader
        title={t("page-title", "Create Character")}
        maxW="breakpoint-md"
      />
      <PageContent sheet maxW="breakpoint-md">
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("error", "Error")}</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}
        <CreateCharacter />
        <Group mt={4} justifyContent={"flex-end"}>
          <Button disabled={loading} onClick={handleCreate}>
            {t("add-character-button", "Add Character")}
          </Button>
        </Group>
      </PageContent>
    </>
  );
}
