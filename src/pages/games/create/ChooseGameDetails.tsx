import { useGameCreateTranslations } from "@/hooks/i18n/useGameCreateTranslations";
import { useCreateGameStore } from "@/stores/createGame.store";
import { Field, Input } from "@chakra-ui/react";
import { useCallback } from "react";

export function GameDetails() {
  const t = useGameCreateTranslations();

  const gameName = useCreateGameStore((store) => store.gameName);
  const setGameName = useCreateGameStore((store) => store.setGameName);

  const handleSetGameName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGameName(e.target.value);
    },
    [setGameName],
  );

  return (
    <Field.Root>
      <Field.Label>{t("game-name-label", "Game Name")}</Field.Label>
      <Input value={gameName} onChange={handleSetGameName} />
    </Field.Root>
  );
}
